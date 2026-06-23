const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const PUBLIC_BASE_URL = "https://media.influsepet.com/profile-images/";
const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function json(body, status) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
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

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname !== "/profile-images") {
      return json({ error: "Not found" }, 404);
    }

    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405);
    }

    return handleProfileImageUpload(request, env);
  },
};

export default worker;
