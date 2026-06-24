const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const PUBLIC_BASE_URL = "https://media.influsepet.com/profile-images/";
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const DELIVERY_MEDIA_PREFIX = "delivery-media/";
const DELIVERY_MEDIA_PART_SIZE_BYTES = 8 * 1024 * 1024;
const PRIVATE_MEDIA_TICKET_MAX_TTL_MS = 15 * 60 * 1000;
const PRIVATE_MEDIA_SESSION_MAX_TTL_MS = PRIVATE_MEDIA_TICKET_MAX_TTL_MS;
const DELIVERY_MEDIA_MIME_LIMITS = new Map([
  ["image/jpeg", { ext: "jpg", maxBytes: 10 * 1024 * 1024 }],
  ["image/png", { ext: "png", maxBytes: 10 * 1024 * 1024 }],
  ["image/webp", { ext: "webp", maxBytes: 10 * 1024 * 1024 }],
  ["video/mp4", { ext: "mp4", maxBytes: 200 * 1024 * 1024 }],
  ["video/quicktime", { ext: "mov", maxBytes: 200 * 1024 * 1024 }],
  ["video/webm", { ext: "webm", maxBytes: 200 * 1024 * 1024 }],
]);
const DELIVERY_MEDIA_KEY_RE =
  /^delivery-media\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpg|png|webp|mp4|mov|webm)$/i;
const DELIVERY_MEDIA_CORS_ORIGINS = new Set(["https://influsepet.com"]);
const DELIVERY_MEDIA_CORS_METHODS = "POST, PUT, OPTIONS";
const DELIVERY_MEDIA_CORS_HEADERS = "Content-Type, Authorization, X-Influsepet-Upload-Session";
const TOKEN_VERSION = 1;
const DELIVERY_UPLOAD_AUDIENCE = "delivery-media:upload";
const UPLOAD_SESSION_AUDIENCE = "delivery-media:upload-session";
const PART_RECEIPT_AUDIENCE = "delivery-media:part-receipt";

function json(body, status) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isDeliveryBrowserUploadPath(pathname) {
  return pathname === "/delivery-media/upload" || pathname.startsWith("/delivery-media/multipart/");
}

function deliveryCorsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  if (!DELIVERY_MEDIA_CORS_ORIGINS.has(origin)) return null;
  const headers = new Headers();
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Vary", "Origin");
  headers.set("Access-Control-Allow-Methods", DELIVERY_MEDIA_CORS_METHODS);
  headers.set("Access-Control-Allow-Headers", DELIVERY_MEDIA_CORS_HEADERS);
  headers.set("Access-Control-Max-Age", "600");
  return headers;
}

function withDeliveryCors(request, response) {
  const cors = deliveryCorsHeaders(request);
  if (!cors) return response;
  const headers = new Headers(response.headers);
  for (const [key, value] of cors) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function deliveryCorsPreflight(request) {
  const cors = deliveryCorsHeaders(request);
  if (!cors) return json({ error: "Not found" }, 404);
  return new Response(null, { status: 204, headers: cors });
}

function normalizeContentType(value) {
  return String(value || "")
    .split(";")[0]
    .trim()
    .toLowerCase();
}

function extensionForMime(mime) {
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  return null;
}

function validateImageBytes(bytes, declaredMime) {
  if (bytes.byteLength < 12) {
    return false;
  }

  const view = new Uint8Array(bytes);
  let detected = null;

  if (view[0] === 0xff && view[1] === 0xd8 && view[2] === 0xff) {
    detected = "image/jpeg";
  } else if (view[0] === 0x89 && view[1] === 0x50 && view[2] === 0x4e && view[3] === 0x47) {
    detected = "image/png";
  } else {
    const riff = String.fromCharCode(view[0], view[1], view[2], view[3]);
    const webp = String.fromCharCode(view[8], view[9], view[10], view[11]);
    if (riff === "RIFF" && webp === "WEBP") {
      detected = "image/webp";
    }
  }

  return detected === declaredMime;
}

function constantTimeEqual(a, b) {
  const encoder = new TextEncoder();
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  const length = Math.max(aBytes.length, bBytes.length);
  let diff = aBytes.length ^ bBytes.length;

  for (let i = 0; i < length; i += 1) {
    diff |= (aBytes[i] || 0) ^ (bBytes[i] || 0);
  }

  return diff === 0;
}

function isAuthorized(request, env) {
  const secret = String(env.PROFILE_IMAGE_GATEWAY_SECRET || "").trim();
  if (!secret) {
    return false;
  }

  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return false;
  }

  return constantTimeEqual(match[1].trim(), secret);
}

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

async function hmacSha256Base64Url(payload, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return bytesToBase64Url(new Uint8Array(signature));
}

async function sha256Base64Url(value) {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return bytesToBase64Url(new Uint8Array(hash));
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalJson(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
}

async function signToken(payload, secret) {
  const encodedPayload = bytesToBase64Url(new TextEncoder().encode(canonicalJson(payload)));
  return `${encodedPayload}.${await hmacSha256Base64Url(encodedPayload, secret)}`;
}

async function verifySignedToken(token, secret) {
  const [payload, signature, extra] = String(token || "").split(".");
  if (!payload || !signature || extra !== undefined) {
    return { ok: false };
  }
  const expectedSignature = await hmacSha256Base64Url(payload, secret);
  if (!constantTimeEqual(signature, expectedSignature)) {
    return { ok: false };
  }
  try {
    return { ok: true, payload: JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload))), encodedPayload: payload };
  } catch {
    return { ok: false };
  }
}

function privateMediaSecret(env) {
  const secret = String(env.PRIVATE_MEDIA_TICKET_SECRET || "").trim();
  return secret || null;
}

function safePositiveInteger(value) {
  return Number.isSafeInteger(value) && value > 0 ? value : null;
}

function isDeliveryMediaObjectKey(value) {
  return typeof value === "string" && DELIVERY_MEDIA_KEY_RE.test(value);
}

function deliveryMediaFilenameFromPath(pathname) {
  const prefix = "/delivery-media/";
  if (!pathname.startsWith(prefix)) return null;
  const filename = pathname.slice(prefix.length);
  if (!/^[a-f0-9-]+\.(?:jpg|png|webp|mp4|mov|webm)$/i.test(filename)) return null;
  const key = `${DELIVERY_MEDIA_PREFIX}${filename}`;
  return isDeliveryMediaObjectKey(key) ? key : null;
}

function rangeOptionsFromHeader(rangeHeader) {
  if (!rangeHeader) return { ok: true, range: undefined };
  const match = rangeHeader.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return { ok: false };
  const [, startRaw, endRaw] = match;
  if (!startRaw && !endRaw) return { ok: false };
  if (!startRaw) {
    const suffix = Number(endRaw);
    if (!Number.isSafeInteger(suffix) || suffix <= 0) return { ok: false };
    return { ok: true, range: { suffix } };
  }
  const offset = Number(startRaw);
  if (!Number.isSafeInteger(offset) || offset < 0) return { ok: false };
  if (!endRaw) return { ok: true, range: { offset } };
  const end = Number(endRaw);
  if (!Number.isSafeInteger(end) || end < offset) return { ok: false };
  return { ok: true, range: { offset, length: end - offset + 1 } };
}

function expectedPartCount(declaredSize) {
  return Math.ceil(declaredSize / DELIVERY_MEDIA_PART_SIZE_BYTES);
}

function expectedPartSize(declaredSize, partNumber) {
  const count = expectedPartCount(declaredSize);
  if (!Number.isSafeInteger(partNumber) || partNumber < 1 || partNumber > count) {
    return null;
  }
  if (partNumber < count) {
    return DELIVERY_MEDIA_PART_SIZE_BYTES;
  }
  return declaredSize - DELIVERY_MEDIA_PART_SIZE_BYTES * (count - 1);
}

function validateUploadTicketClaims(claims, expectedAudience, now) {
  if (!claims || typeof claims !== "object") return null;
  if (claims.version !== TOKEN_VERSION || claims.audience !== expectedAudience) return null;
  const mimeRules = DELIVERY_MEDIA_MIME_LIMITS.get(String(claims.mimeType || ""));
  const iat = safePositiveInteger(claims.iat);
  const exp = safePositiveInteger(claims.exp);
  const declaredSize = safePositiveInteger(claims.declaredSize);
  const maxBytes = safePositiveInteger(claims.maxBytes);
  if (
    !mimeRules ||
    !iat ||
    !exp ||
    exp <= iat ||
    exp - iat > PRIVATE_MEDIA_TICKET_MAX_TTL_MS ||
    exp <= now ||
    !declaredSize ||
    !maxBytes ||
    declaredSize > maxBytes ||
    maxBytes > mimeRules.maxBytes ||
    typeof claims.offerId !== "string" ||
    !claims.offerId.trim() ||
    typeof claims.actorUserId !== "string" ||
    !claims.actorUserId.trim() ||
    typeof claims.nonce !== "string" ||
    !claims.nonce.trim()
  ) {
    return null;
  }
  return { claims, mimeRules };
}

async function verifyUploadTicket(request, env, expectedAudience) {
  const secret = privateMediaSecret(env);
  if (!secret) {
    return { ok: false, response: json({ error: "Private media ticket signing is not configured" }, 503) };
  }
  const header = request.headers.get("Authorization") || "";
  const match = header.match(/^PrivateMediaTicket\s+(.+)$/i);
  if (!match) {
    return { ok: false, response: json({ error: "Unauthorized" }, 401) };
  }
  const token = await verifySignedToken(match[1].trim(), secret);
  if (!token.ok) {
    return { ok: false, response: json({ error: "Invalid ticket" }, 401) };
  }
  const validated = validateUploadTicketClaims(token.payload, expectedAudience, Date.now());
  if (!validated) {
    return { ok: false, response: json({ error: "Invalid ticket" }, 401) };
  }
  return {
    ok: true,
    claims: validated.claims,
    mimeRules: validated.mimeRules,
    claimsHash: await sha256Base64Url(token.encodedPayload),
    secret,
  };
}

function validateUploadSessionClaims(session, now) {
  if (!session || typeof session !== "object") return null;
  if (session.version !== TOKEN_VERSION || session.audience !== UPLOAD_SESSION_AUDIENCE) return null;
  const mimeRules = DELIVERY_MEDIA_MIME_LIMITS.get(String(session.mimeType || ""));
  const issuedAt = safePositiveInteger(session.issuedAt);
  const expiresAt = safePositiveInteger(session.expiresAt);
  const declaredSize = safePositiveInteger(session.declaredSize);
  const maxBytes = safePositiveInteger(session.maxBytes);
  if (
    !mimeRules ||
    !issuedAt ||
    !expiresAt ||
    expiresAt <= issuedAt ||
    expiresAt - issuedAt > PRIVATE_MEDIA_SESSION_MAX_TTL_MS ||
    expiresAt <= now ||
    !declaredSize ||
    !maxBytes ||
    declaredSize > maxBytes ||
    maxBytes > mimeRules.maxBytes ||
    typeof session.sessionId !== "string" ||
    !session.sessionId.trim() ||
    typeof session.claimsHash !== "string" ||
    !session.claimsHash.trim() ||
    typeof session.offerId !== "string" ||
    !session.offerId.trim() ||
    typeof session.actorUserId !== "string" ||
    !session.actorUserId.trim() ||
    typeof session.nonce !== "string" ||
    !session.nonce.trim() ||
    !isDeliveryMediaObjectKey(session.objectKey) ||
    typeof session.uploadId !== "string" ||
    !/^[a-zA-Z0-9._:-]{8,512}$/.test(session.uploadId)
  ) {
    return null;
  }
  return session;
}

async function verifyUploadSessionToken(uploadSession, secret) {
  const token = await verifySignedToken(uploadSession, secret);
  if (!token.ok) return null;
  return validateUploadSessionClaims(token.payload, Date.now());
}

function validatePartReceipt(receipt, session, secret) {
  return verifySignedToken(receipt, secret).then((token) => {
    if (!token.ok) return null;
    const payload = token.payload;
    if (!payload || typeof payload !== "object") return null;
    if (payload.version !== TOKEN_VERSION || payload.audience !== PART_RECEIPT_AUDIENCE) return null;
    if (payload.sessionId !== session.sessionId || payload.claimsHash !== session.claimsHash) return null;
    if (!Number.isSafeInteger(payload.partNumber) || payload.partNumber < 1) return null;
    if (!Number.isSafeInteger(payload.byteCount) || payload.byteCount <= 0) return null;
    if (typeof payload.etag !== "string" || !payload.etag.trim()) return null;
    if (!Number.isSafeInteger(payload.expiresAt) || payload.expiresAt <= Date.now()) return null;
    return payload;
  });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function abortMultipartUpload(env, session) {
  try {
    const upload = env.PROFILE_IMAGES.resumeMultipartUpload(session.objectKey, session.uploadId);
    await upload.abort();
  } catch {
    /* safe best-effort cleanup */
  }
}

async function handleProfileImageUpload(request, env) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const contentType = normalizeContentType(request.headers.get("Content-Type"));
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    return json({ error: "Unsupported file type" }, 400);
  }

  const contentLengthHeader = request.headers.get("Content-Length");
  if (contentLengthHeader && Number(contentLengthHeader) > MAX_UPLOAD_BYTES) {
    return json({ error: "File too large" }, 413);
  }

  let body;
  try {
    body = await request.arrayBuffer();
  } catch {
    return json({ error: "Invalid upload" }, 400);
  }

  if (body.byteLength === 0 || body.byteLength > MAX_UPLOAD_BYTES) {
    return json({ error: "File too large" }, body.byteLength > MAX_UPLOAD_BYTES ? 413 : 400);
  }

  if (!validateImageBytes(body, contentType)) {
    return json({ error: "Unsupported file type" }, 400);
  }

  const ext = extensionForMime(contentType);
  const key = `profile-images/${crypto.randomUUID()}.${ext}`;

  try {
    await env.PROFILE_IMAGES.put(key, body, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("PROFILE_IMAGE_GATEWAY_R2_PUT_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "Upload failed" }, 502);
  }

  return json({ ok: true, url: `${PUBLIC_BASE_URL}${key.slice("profile-images/".length)}` }, 201);
}

async function handleDeliveryMultipartInit(request, env) {
  const ticket = await verifyUploadTicket(request, env, DELIVERY_UPLOAD_AUDIENCE);
  if (!ticket.ok) return ticket.response;

  const now = Date.now();
  const sessionId = crypto.randomUUID();
  const objectKey = `${DELIVERY_MEDIA_PREFIX}${crypto.randomUUID()}.${ticket.mimeRules.ext}`;

  try {
    const upload = await env.PROFILE_IMAGES.createMultipartUpload(objectKey, {
      httpMetadata: {
        contentType: ticket.claims.mimeType,
        cacheControl: "private, no-store",
      },
      customMetadata: {
        privateMediaScope: "delivery",
        sessionId,
        claimsHash: ticket.claimsHash,
      },
    });

    const session = {
      version: TOKEN_VERSION,
      audience: UPLOAD_SESSION_AUDIENCE,
      sessionId,
      claimsHash: ticket.claimsHash,
      offerId: ticket.claims.offerId,
      actorUserId: ticket.claims.actorUserId,
      mimeType: ticket.claims.mimeType,
      declaredSize: ticket.claims.declaredSize,
      maxBytes: ticket.claims.maxBytes,
      nonce: ticket.claims.nonce,
      objectKey,
      uploadId: upload.uploadId,
      issuedAt: now,
      expiresAt: Math.min(ticket.claims.exp, now + PRIVATE_MEDIA_SESSION_MAX_TTL_MS),
    };

    return json(
      {
        ok: true,
        uploadSession: await signToken(session, ticket.secret),
        partSizeBytes: DELIVERY_MEDIA_PART_SIZE_BYTES,
        expectedPartCount: expectedPartCount(ticket.claims.declaredSize),
        maxBytes: ticket.claims.maxBytes,
      },
      201,
    );
  } catch (error) {
    console.error("DELIVERY_MEDIA_MULTIPART_INIT_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "Upload initialization failed" }, 502);
  }
}

async function handleDeliverySingleUpload(request, env) {
  const ticket = await verifyUploadTicket(request, env, DELIVERY_UPLOAD_AUDIENCE);
  if (!ticket.ok) return ticket.response;

  const contentType = normalizeContentType(request.headers.get("Content-Type"));
  if (contentType !== ticket.claims.mimeType) {
    return json({ error: "Unsupported file type" }, 400);
  }

  const contentLengthHeader = request.headers.get("Content-Length");
  if (contentLengthHeader && Number(contentLengthHeader) !== ticket.claims.declaredSize) {
    return json({ error: "Invalid upload size" }, 413);
  }

  let body;
  try {
    body = await request.arrayBuffer();
  } catch {
    return json({ error: "Invalid upload" }, 400);
  }

  if (body.byteLength === 0) {
    return json({ error: "Invalid upload" }, 400);
  }
  if (body.byteLength !== ticket.claims.declaredSize || body.byteLength > ticket.claims.maxBytes) {
    return json({ error: "Invalid upload size" }, 413);
  }

  const now = Date.now();
  const sessionId = crypto.randomUUID();
  const objectKey = `${DELIVERY_MEDIA_PREFIX}${crypto.randomUUID()}.${ticket.mimeRules.ext}`;
  const claimsHash = ticket.claimsHash;

  try {
    await env.PROFILE_IMAGES.put(objectKey, body, {
      httpMetadata: {
        contentType: ticket.claims.mimeType,
        cacheControl: "private, no-store",
      },
      customMetadata: {
        privateMediaScope: "delivery",
        sessionId,
        claimsHash,
      },
    });

    const session = {
      version: TOKEN_VERSION,
      audience: UPLOAD_SESSION_AUDIENCE,
      sessionId,
      claimsHash,
      offerId: ticket.claims.offerId,
      actorUserId: ticket.claims.actorUserId,
      mimeType: ticket.claims.mimeType,
      declaredSize: ticket.claims.declaredSize,
      maxBytes: ticket.claims.maxBytes,
      nonce: ticket.claims.nonce,
      objectKey,
      uploadId: `single-${sessionId}`,
      issuedAt: now,
      expiresAt: Math.min(ticket.claims.exp, now + PRIVATE_MEDIA_SESSION_MAX_TTL_MS),
    };

    return json(
      {
        ok: true,
        uploadSession: await signToken(session, ticket.secret),
        storageProvider: "R2",
        objectKey,
        mimeType: ticket.claims.mimeType,
        sizeBytes: ticket.claims.declaredSize,
      },
      201,
    );
  } catch (error) {
    console.error("DELIVERY_MEDIA_SINGLE_UPLOAD_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "",
      bodyByteLength: body.byteLength,
      hasKey: Boolean(objectKey),
    });
    return json({ error: "Upload failed" }, 502);
  }
}

async function handleDeliveryMultipartPart(request, env) {
  const secret = privateMediaSecret(env);
  if (!secret) {
    return json({ error: "Private media ticket signing is not configured" }, 503);
  }

  const url = new URL(request.url);
  const partNumber = Number(url.searchParams.get("partNumber"));
  const uploadSession = request.headers.get("X-Influsepet-Upload-Session") || "";
  const session = await verifyUploadSessionToken(uploadSession, secret);
  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  const expectedSize = expectedPartSize(session.declaredSize, partNumber);
  if (!expectedSize) {
    await abortMultipartUpload(env, session);
    return json({ error: "Invalid part number" }, 400);
  }

  const contentLengthRaw = request.headers.get("Content-Length");
  if (contentLengthRaw !== null && Number(contentLengthRaw) !== expectedSize) {
    await abortMultipartUpload(env, session);
    return json({ error: "Invalid part size" }, 413);
  }
  let partBody;
  try {
    partBody = await request.arrayBuffer();
  } catch {
    await abortMultipartUpload(env, session);
    return json({ error: "Invalid part body" }, 400);
  }

  const bodyByteLength = partBody.byteLength;
  if (bodyByteLength === 0) {
    await abortMultipartUpload(env, session);
    return json({ error: "Missing upload body" }, 400);
  }
  if (bodyByteLength !== expectedSize) {
    await abortMultipartUpload(env, session);
    return json({ error: "Invalid part size" }, 413);
  }

  try {
    const upload = env.PROFILE_IMAGES.resumeMultipartUpload(session.objectKey, session.uploadId);
    const part = await upload.uploadPart(partNumber, partBody);

    const receipt = {
      version: TOKEN_VERSION,
      audience: PART_RECEIPT_AUDIENCE,
      sessionId: session.sessionId,
      claimsHash: session.claimsHash,
      partNumber,
      etag: part.etag,
      byteCount: bodyByteLength,
      expiresAt: session.expiresAt,
    };

    return json({ ok: true, partReceipt: await signToken(receipt, secret) }, 200);
  } catch (error) {
    await abortMultipartUpload(env, session);
    console.error("DELIVERY_MEDIA_MULTIPART_PART_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : "",
      partNumber,
      bodyByteLength,
      hasKey: Boolean(session.objectKey),
      hasUploadId: Boolean(session.uploadId),
    });
    return json({ error: "Part upload failed" }, 502);
  }
}

async function handleDeliveryMultipartComplete(request, env) {
  const secret = privateMediaSecret(env);
  if (!secret) {
    return json({ error: "Private media ticket signing is not configured" }, 503);
  }

  const body = await readJson(request);
  const uploadSession = typeof body?.uploadSession === "string" ? body.uploadSession : "";
  const partReceipts = Array.isArray(body?.partReceipts) ? body.partReceipts : [];
  const session = await verifyUploadSessionToken(uploadSession, secret);
  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }

  const expectedCount = expectedPartCount(session.declaredSize);
  if (partReceipts.length !== expectedCount) {
    await abortMultipartUpload(env, session);
    return json({ error: "Invalid multipart completion request" }, 400);
  }

  const receipts = [];
  const seen = new Set();
  for (const receiptToken of partReceipts) {
    if (typeof receiptToken !== "string") {
      await abortMultipartUpload(env, session);
      return json({ error: "Invalid multipart completion request" }, 400);
    }
    const receipt = await validatePartReceipt(receiptToken, session, secret);
    if (!receipt || seen.has(receipt.partNumber)) {
      await abortMultipartUpload(env, session);
      return json({ error: "Invalid multipart completion request" }, 400);
    }
    const expectedSize = expectedPartSize(session.declaredSize, receipt.partNumber);
    if (receipt.byteCount !== expectedSize) {
      await abortMultipartUpload(env, session);
      return json({ error: "Invalid multipart completion request" }, 400);
    }
    seen.add(receipt.partNumber);
    receipts.push(receipt);
  }

  receipts.sort((a, b) => a.partNumber - b.partNumber);
  let totalBytes = 0;
  for (let index = 0; index < receipts.length; index += 1) {
    if (receipts[index].partNumber !== index + 1) {
      await abortMultipartUpload(env, session);
      return json({ error: "Invalid multipart completion request" }, 400);
    }
    totalBytes += receipts[index].byteCount;
  }
  if (totalBytes !== session.declaredSize || session.declaredSize > session.maxBytes) {
    await abortMultipartUpload(env, session);
    return json({ error: "Invalid multipart completion request" }, 400);
  }

  try {
    const upload = env.PROFILE_IMAGES.resumeMultipartUpload(session.objectKey, session.uploadId);
    await upload.complete(receipts.map((part) => ({ partNumber: part.partNumber, etag: part.etag })));
    const object = await env.PROFILE_IMAGES.head(session.objectKey);
    const metadata = object?.customMetadata || {};
    const contentType = object?.httpMetadata?.contentType || object?.httpMetadata?.contentType;
    const verified =
      object &&
      object.size === session.declaredSize &&
      contentType === session.mimeType &&
      metadata.privateMediaScope === "delivery" &&
      metadata.sessionId === session.sessionId &&
      metadata.claimsHash === session.claimsHash;

    if (!verified) {
      try {
        await env.PROFILE_IMAGES.delete(session.objectKey);
      } catch {
        /* best-effort cleanup */
      }
      return json({ error: "Upload verification failed" }, 502);
    }

    return json(
      {
        ok: true,
        storageProvider: "R2",
        objectKey: session.objectKey,
        mimeType: session.mimeType,
        sizeBytes: session.declaredSize,
      },
      200,
    );
  } catch (error) {
    console.error("DELIVERY_MEDIA_MULTIPART_COMPLETE_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "Upload completion failed" }, 502);
  }
}

async function handleDeliveryMultipartAbort(request, env) {
  const secret = privateMediaSecret(env);
  if (!secret) {
    return json({ error: "Private media ticket signing is not configured" }, 503);
  }
  const body = await readJson(request);
  const uploadSession = typeof body?.uploadSession === "string" ? body.uploadSession : "";
  const session = await verifyUploadSessionToken(uploadSession, secret);
  if (!session) {
    return json({ error: "Unauthorized" }, 401);
  }
  await abortMultipartUpload(env, session);
  return json({ ok: true }, 200);
}

async function handleDeliveryMediaRead(request, env, objectKey, headOnly = false) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized" }, 401);
  }

  const parsedRange = rangeOptionsFromHeader(request.headers.get("Range"));
  if (!parsedRange.ok) {
    return json({ error: "Invalid range" }, 416);
  }

  try {
    if (headOnly) {
      const object = await env.PROFILE_IMAGES.head(objectKey);
      if (!object) {
        return json({ error: "Not found" }, 404);
      }
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("Cache-Control", "private, no-store");
      headers.set("Content-Length", String(object.size));
      headers.set("X-Influsepet-Private-Media-Scope", object.customMetadata?.privateMediaScope || "");
      return new Response(null, { status: 200, headers });
    }

    const object = await env.PROFILE_IMAGES.get(
      objectKey,
      parsedRange.range ? { range: parsedRange.range } : undefined,
    );
    if (!object) {
      return json({ error: "Not found" }, 404);
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "private, no-store");
    headers.set("Content-Length", String(object.size));
    headers.set("Accept-Ranges", "bytes");
    if (parsedRange.range) {
      const totalSize = object.size;
      if (typeof parsedRange.range.offset === "number") {
        const start = parsedRange.range.offset;
        const length = parsedRange.range.length || Math.max(totalSize - start, 0);
        const end = Math.min(start + length - 1, totalSize - 1);
        headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
        headers.set("Content-Length", String(Math.max(end - start + 1, 0)));
      } else if (typeof parsedRange.range.suffix === "number") {
        const start = Math.max(totalSize - parsedRange.range.suffix, 0);
        const end = totalSize - 1;
        headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
        headers.set("Content-Length", String(totalSize - start));
      }
    }
    return new Response(object.body, {
      status: parsedRange.range ? 206 : 200,
      headers,
    });
  } catch (error) {
    console.error("DELIVERY_MEDIA_READ_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "Read failed" }, 502);
  }
}

async function handleDeliveryMediaDelete(request, env, objectKey) {
  if (!isAuthorized(request, env)) {
    return json({ error: "Unauthorized" }, 401);
  }

  try {
    await env.PROFILE_IMAGES.delete(objectKey);
    return json({ ok: true }, 200);
  } catch (error) {
    console.error("DELIVERY_MEDIA_DELETE_FAILED", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return json({ error: "Delete failed" }, 502);
  }
}

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && isDeliveryBrowserUploadPath(url.pathname)) {
      return deliveryCorsPreflight(request);
    }

    if (url.pathname === "/profile-images") {
      if (request.method !== "POST") {
        return json({ error: "Method not allowed" }, 405);
      }
      return handleProfileImageUpload(request, env);
    }

    if (url.pathname === "/delivery-media/upload" && request.method === "PUT") {
      return withDeliveryCors(request, await handleDeliverySingleUpload(request, env));
    }

    if (url.pathname === "/delivery-media/multipart/init" && request.method === "POST") {
      return withDeliveryCors(request, await handleDeliveryMultipartInit(request, env));
    }
    if (url.pathname === "/delivery-media/multipart/part" && request.method === "PUT") {
      return withDeliveryCors(request, await handleDeliveryMultipartPart(request, env));
    }
    if (url.pathname === "/delivery-media/multipart/complete" && request.method === "POST") {
      return withDeliveryCors(request, await handleDeliveryMultipartComplete(request, env));
    }
    if (url.pathname === "/delivery-media/multipart/abort" && request.method === "POST") {
      return withDeliveryCors(request, await handleDeliveryMultipartAbort(request, env));
    }

    const deliveryObjectKey = deliveryMediaFilenameFromPath(url.pathname);
    if (deliveryObjectKey && request.method === "GET") {
      return handleDeliveryMediaRead(request, env, deliveryObjectKey);
    }
    if (deliveryObjectKey && request.method === "HEAD") {
      return handleDeliveryMediaRead(request, env, deliveryObjectKey, true);
    }
    if (deliveryObjectKey && request.method === "DELETE") {
      return handleDeliveryMediaDelete(request, env, deliveryObjectKey);
    }

    if (url.pathname.startsWith("/delivery-media/")) {
      return json({ error: "Method not allowed" }, 405);
    }

    return json({ error: "Not found" }, 404);
  },
};

export default worker;
export {
  DELIVERY_UPLOAD_AUDIENCE,
  PRIVATE_MEDIA_TICKET_MAX_TTL_MS,
  expectedPartCount,
  expectedPartSize,
  isDeliveryMediaObjectKey,
  rangeOptionsFromHeader,
};
