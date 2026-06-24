import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import worker, {
  DELIVERY_UPLOAD_AUDIENCE,
  PRIVATE_MEDIA_TICKET_MAX_TTL_MS,
  isDeliveryMediaObjectKey,
  rangeOptionsFromHeader,
} from "../../workers/profile-image-gateway/src/index.js";
import {
  PRIVATE_MEDIA_TICKET_VERSION,
  signPrivateMediaTicket,
} from "../../src/lib/uploads/privateMediaTicket";

const profileSecret = "profile-secret";
const privateTicketSecret = "private-ticket-secret";
const objectKey = "delivery-media/123e4567-e89b-12d3-a456-426614174000.jpg";
const PART_SIZE = 10 * 1024 * 1024;

function pngBytes(): Uint8Array {
  return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]);
}

async function streamSize(body: ReadableStream<Uint8Array>): Promise<number> {
  let size = 0;
  for await (const chunk of body) {
    size += chunk.byteLength;
  }
  return size;
}

function mockEnv(options: { metadataMismatch?: boolean } = {}) {
  const state = {
    created: [] as { key: string; uploadId: string; metadata: Record<string, string>; contentType: string }[],
    uploadedParts: [] as { key: string; uploadId: string; partNumber: number; size: number; etag: string }[],
    deleted: [] as string[],
    completed: null as null | { key: string; uploadId: string; parts: { partNumber: number; etag: string }[]; size: number },
    usedPartKeys: [] as string[],
  };

  const env = {
    PROFILE_IMAGE_GATEWAY_SECRET: profileSecret,
    PRIVATE_MEDIA_TICKET_SECRET: privateTicketSecret,
    PROFILE_IMAGES: {
      put: async () => undefined,
      head: async (key: string) => {
        const created = state.created.find((item) => item.key === key);
        if (!created || !state.completed) return null;
        return {
          size: options.metadataMismatch ? state.completed.size + 1 : state.completed.size,
          httpEtag: "etag",
          httpMetadata: { contentType: created.contentType },
          customMetadata: options.metadataMismatch
            ? { privateMediaScope: "delivery", sessionId: "wrong", claimsHash: "wrong" }
            : created.metadata,
          writeHttpMetadata(headers: Headers) {
            headers.set("Content-Type", created.contentType);
          },
        };
      },
      get: async () => null,
      delete: async (key: string) => {
        state.deleted.push(key);
      },
      resumeMultipartUpload: (key: string, uploadId: string) => ({
        complete: async (parts: { partNumber: number; etag: string }[]) => {
          const size = parts.reduce((total, part) => {
            const row = state.uploadedParts.find((p) => p.key === key && p.uploadId === uploadId && p.partNumber === part.partNumber);
            return total + (row?.size ?? 0);
          }, 0);
          state.completed = { key, uploadId, parts, size };
          return { size };
        },
        abort: async () => {
          state.deleted.push(`abort:${key}:${uploadId}`);
        },
        uploadPart: async (partNumber: number, body: ReadableStream<Uint8Array>) => {
          state.usedPartKeys.push(key);
          const size = await streamSize(body);
          const etag = `etag-${partNumber}-${size}`;
          state.uploadedParts.push({ key, uploadId, partNumber, size, etag });
          return { partNumber, etag };
        },
      }),
      createMultipartUpload: async (key: string, opts: { httpMetadata: { contentType: string }; customMetadata: Record<string, string> }) => {
        const uploadId = `upload-${state.created.length + 100}`;
        state.created.push({
          key,
          uploadId,
          metadata: opts.customMetadata,
          contentType: opts.httpMetadata.contentType,
        });
        return { uploadId };
      },
    },
  };

  return { env, state };
}

function ticket({
  declaredSize = 10 * 1024 * 1024,
  mimeType = "image/jpeg",
  iat = Date.now(),
  exp = Date.now() + 60_000,
  audience = DELIVERY_UPLOAD_AUDIENCE,
  offerId = "offer_123",
  actorUserId = "user_123",
} = {}) {
  return signPrivateMediaTicket(
    {
      version: PRIVATE_MEDIA_TICKET_VERSION,
      audience,
      offerId,
      actorUserId,
      mimeType,
      declaredSize,
      maxBytes: mimeType.startsWith("video/") ? 200 * 1024 * 1024 : 10 * 1024 * 1024,
      iat,
      exp,
      nonce: "nonce_123",
    },
    privateTicketSecret,
  );
}

function rawTicket(claims: Record<string, unknown>) {
  const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
  const signature = createHmac("sha256", privateTicketSecret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

async function initUpload(env: ReturnType<typeof mockEnv>["env"], uploadTicket = ticket()) {
  const res = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/init", {
      method: "POST",
      headers: { Authorization: `PrivateMediaTicket ${uploadTicket}` },
    }),
    env,
  );
  assert.equal(res.status, 201);
  return (await res.json()) as { uploadSession: string; expectedPartCount: number };
}

async function uploadPart(env: ReturnType<typeof mockEnv>["env"], uploadSession: string, partNumber: number, bytes: Uint8Array) {
  const res = await worker.fetch(
    new Request(`https://worker.example/delivery-media/multipart/part?partNumber=${partNumber}&objectKey=delivery-media/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg&uploadId=client-controlled`, {
      method: "PUT",
      headers: {
        "X-Influsepet-Upload-Session": uploadSession,
        "Content-Length": String(bytes.byteLength),
      },
      body: bytes,
    }),
    env,
  );
  return res;
}

test("profile-image Worker behavior is unchanged when private ticket secret is missing", async () => {
  const { env } = mockEnv();
  env.PRIVATE_MEDIA_TICKET_SECRET = undefined as unknown as string;
  const res = await worker.fetch(
    new Request("https://worker.example/profile-images", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${profileSecret}`,
        "Content-Type": "image/png",
      },
      body: pngBytes(),
    }),
    env,
  );
  assert.equal(res.status, 201);
  const body = (await res.json()) as { ok?: boolean; url?: string };
  assert.equal(body.ok, true);
  assert.equal(body.url?.startsWith("https://media.influsepet.com/profile-images/"), true);
});

test("missing PRIVATE_MEDIA_TICKET_SECRET disables delivery upload endpoints without affecting profile images", async () => {
  const { env } = mockEnv();
  env.PRIVATE_MEDIA_TICKET_SECRET = undefined as unknown as string;
  const res = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/init", {
      method: "POST",
      headers: { Authorization: `PrivateMediaTicket ${ticket()}` },
    }),
    env,
  );
  assert.equal(res.status, 503);
});

test("browser private media tickets cannot access profile-image endpoint", async () => {
  const { env } = mockEnv();
  const res = await worker.fetch(
    new Request("https://worker.example/profile-images", {
      method: "POST",
      headers: {
        Authorization: `PrivateMediaTicket ${ticket()}`,
        "Content-Type": "image/png",
      },
      body: pngBytes(),
    }),
    env,
  );
  assert.equal(res.status, 401);
});

test("Worker-generated upload session binds objectKey and uploadId; client raw values are ignored", async () => {
  const { env, state } = mockEnv();
  const { uploadSession } = await initUpload(env);
  const res = await uploadPart(env, uploadSession, 1, new Uint8Array(PART_SIZE));
  assert.equal(res.status, 200);
  assert.equal(state.usedPartKeys[0], state.created[0].key);
  assert.notEqual(state.usedPartKeys[0], "delivery-media/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg");
});

test("tampered upload sessions and bad ticket claims fail", async () => {
  const { env } = mockEnv();
  const { uploadSession } = await initUpload(env);
  const tampered = `${uploadSession}x`;
  assert.equal((await uploadPart(env, tampered, 1, new Uint8Array(PART_SIZE))).status, 401);

  const now = Date.now();
  const tooLongTicket = rawTicket({
    version: PRIVATE_MEDIA_TICKET_VERSION,
    audience: DELIVERY_UPLOAD_AUDIENCE,
    offerId: "offer_123",
    actorUserId: "user_123",
    mimeType: "image/jpeg",
    declaredSize: PART_SIZE,
    maxBytes: PART_SIZE,
    iat: now,
    exp: now + PRIVATE_MEDIA_TICKET_MAX_TTL_MS + 1,
    nonce: "nonce_123",
  });
  const tooLong = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/init", {
      method: "POST",
      headers: { Authorization: `PrivateMediaTicket ${tooLongTicket}` },
    }),
    env,
  );
  assert.equal(tooLong.status, 401);
});

test("wrong part number and wrong part size fail and abort the multipart upload", async () => {
  const { env, state } = mockEnv();
  const { uploadSession } = await initUpload(env);
  assert.equal((await uploadPart(env, uploadSession, 2, new Uint8Array(PART_SIZE))).status, 400);
  assert.equal((await uploadPart(env, uploadSession, 1, new Uint8Array(PART_SIZE - 1))).status, 413);
  assert.equal(state.deleted.some((item) => item.startsWith("abort:")), true);
});

test("completion requires exact verified receipt set and emits no public URL", async () => {
  const { env } = mockEnv();
  const { uploadSession } = await initUpload(env, ticket({ declaredSize: PART_SIZE + 3, mimeType: "video/mp4" }));
  const part1 = (await (await uploadPart(env, uploadSession, 1, new Uint8Array(PART_SIZE))).json()) as { partReceipt: string };
  const part2 = (await (await uploadPart(env, uploadSession, 2, new Uint8Array(3))).json()) as { partReceipt: string };

  const duplicate = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadSession, partReceipts: [part1.partReceipt, part1.partReceipt] }),
    }),
    env,
  );
  assert.equal(duplicate.status, 400);

  const ok = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadSession, partReceipts: [part1.partReceipt, part2.partReceipt] }),
    }),
    env,
  );
  assert.equal(ok.status, 200);
  const body = (await ok.json()) as { url?: string; objectKey?: string; storageProvider?: string; sizeBytes?: number };
  assert.equal(body.url, undefined);
  assert.equal(body.storageProvider, "R2");
  assert.equal(body.sizeBytes, PART_SIZE + 3);
  assert.equal(typeof body.objectKey, "string");
});

test("receipts from another session and completion metadata mismatch fail safely", async () => {
  const a = mockEnv();
  const b = mockEnv({ metadataMismatch: true });
  const sessionA = (await initUpload(a.env)).uploadSession;
  const sessionB = (await initUpload(b.env)).uploadSession;
  const receiptA = (await (await uploadPart(a.env, sessionA, 1, new Uint8Array(PART_SIZE))).json()) as { partReceipt: string };

  const mixed = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadSession: sessionB, partReceipts: [receiptA.partReceipt] }),
    }),
    b.env,
  );
  assert.equal(mixed.status, 400);

  const receiptB = (await (await uploadPart(b.env, sessionB, 1, new Uint8Array(PART_SIZE))).json()) as { partReceipt: string };
  const mismatch = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/complete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadSession: sessionB, partReceipts: [receiptB.partReceipt] }),
    }),
    b.env,
  );
  assert.equal(mismatch.status, 502);
  assert.equal(b.state.deleted.some((item) => item.startsWith("delivery-media/")), true);
});

test("abort uses only verified upload session state", async () => {
  const { env, state } = mockEnv();
  const { uploadSession } = await initUpload(env);
  const res = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/abort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uploadSession, objectKey: "delivery-media/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.jpg", uploadId: "client" }),
    }),
    env,
  );
  assert.equal(res.status, 200);
  assert.equal(state.deleted[0], `abort:${state.created[0].key}:${state.created[0].uploadId}`);
});

test("Worker rejects public unauthenticated delivery reads and keeps strict range/object key parsing", async () => {
  const { env } = mockEnv();
  const res = await worker.fetch(new Request(`https://worker.example/${objectKey}`), env);
  assert.equal(res.status, 401);
  assert.equal(isDeliveryMediaObjectKey(objectKey), true);
  assert.equal(isDeliveryMediaObjectKey("delivery-media/not-a-uuid.jpg"), false);
  assert.deepEqual(rangeOptionsFromHeader("bytes=0-99"), { ok: true, range: { offset: 0, length: 100 } });
  assert.deepEqual(rangeOptionsFromHeader("bytes=99-0"), { ok: false });
});

test("delivery multipart CORS preflight allows only the production browser origin", async () => {
  const { env } = mockEnv();
  const trusted = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/part", {
      method: "OPTIONS",
      headers: {
        Origin: "https://influsepet.com",
        "Access-Control-Request-Method": "PUT",
        "Access-Control-Request-Headers": "Content-Type, X-Influsepet-Upload-Session",
      },
    }),
    env,
  );
  assert.equal(trusted.status, 204);
  assert.equal(trusted.headers.get("Access-Control-Allow-Origin"), "https://influsepet.com");
  assert.match(trusted.headers.get("Access-Control-Allow-Headers") ?? "", /X-Influsepet-Upload-Session/);

  const untrusted = await worker.fetch(
    new Request("https://worker.example/delivery-media/multipart/part", {
      method: "OPTIONS",
      headers: {
        Origin: "https://evil.example",
        "Access-Control-Request-Method": "PUT",
      },
    }),
    env,
  );
  assert.equal(untrusted.headers.get("Access-Control-Allow-Origin"), null);
});

test("delivery multipart CORS is not added to profile-image endpoints", async () => {
  const { env } = mockEnv();
  const res = await worker.fetch(
    new Request("https://worker.example/profile-images", {
      method: "OPTIONS",
      headers: { Origin: "https://influsepet.com" },
    }),
    env,
  );
  assert.equal(res.headers.get("Access-Control-Allow-Origin"), null);
});
