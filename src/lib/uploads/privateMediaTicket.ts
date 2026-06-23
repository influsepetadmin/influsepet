import { createHmac, timingSafeEqual } from "crypto";

export const PRIVATE_MEDIA_TICKET_VERSION = 1 as const;
export const PRIVATE_MEDIA_TICKET_MAX_TTL_MS = 15 * 60 * 1000;

export type PrivateMediaTicketAudience = "delivery-media:upload";

export type PrivateMediaTicketClaims = {
  version: typeof PRIVATE_MEDIA_TICKET_VERSION;
  audience: PrivateMediaTicketAudience;
  offerId: string;
  actorUserId: string;
  mimeType: string;
  declaredSize: number;
  maxBytes: number;
  iat: number;
  exp: number;
  nonce: string;
};

export type PrivateMediaTicketVerifyResult =
  | { ok: true; claims: PrivateMediaTicketClaims }
  | { ok: false; error: "CONFIG_MISSING" | "MALFORMED" | "BAD_SIGNATURE" | "EXPIRED" | "CLAIMS_INVALID" | "AUDIENCE_MISMATCH" };

const ALLOWED_PRIVATE_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

function base64UrlEncode(value: string | Buffer): string {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string): Buffer {
  return Buffer.from(value, "base64url");
}

function signPayload(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function safePositiveInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null;
}

export function isAllowedPrivateMediaMimeType(value: string): boolean {
  return ALLOWED_PRIVATE_MEDIA_MIME_TYPES.has(value);
}

export function normalizePrivateMediaTicketSecret(secret: string | undefined | null): string | null {
  const trimmed = secret?.trim();
  return trimmed ? trimmed : null;
}

export function isValidPrivateMediaTicketClaims(
  claims: unknown,
  expectedAudience?: PrivateMediaTicketAudience,
): claims is PrivateMediaTicketClaims {
  if (!isRecord(claims)) return false;
  if (claims.version !== PRIVATE_MEDIA_TICKET_VERSION) return false;
  const audience = safeString(claims.audience);
  if (!audience) return false;
  if (expectedAudience && audience !== expectedAudience) return false;
  if (!audience.startsWith("delivery-media:")) return false;
  const offerId = safeString(claims.offerId);
  const actorUserId = safeString(claims.actorUserId);
  const mimeType = safeString(claims.mimeType);
  const nonce = safeString(claims.nonce);
  const declaredSize = safePositiveInteger(claims.declaredSize);
  const maxBytes = safePositiveInteger(claims.maxBytes);
  const iat = safePositiveInteger(claims.iat);
  const exp = safePositiveInteger(claims.exp);
  if (!offerId || !actorUserId || !mimeType || !nonce || !declaredSize || !maxBytes || !iat || !exp) return false;
  if (!isAllowedPrivateMediaMimeType(mimeType)) return false;
  if (declaredSize > maxBytes) return false;
  if (exp <= iat || exp - iat > PRIVATE_MEDIA_TICKET_MAX_TTL_MS) return false;
  return true;
}

export function signPrivateMediaTicket(
  claims: PrivateMediaTicketClaims,
  secret: string,
): string {
  if (!isValidPrivateMediaTicketClaims(claims)) {
    throw new Error("Invalid private media ticket claims");
  }
  const normalizedSecret = normalizePrivateMediaTicketSecret(secret);
  if (!normalizedSecret) {
    throw new Error("Missing private media ticket secret");
  }
  const payload = base64UrlEncode(JSON.stringify(claims));
  return `${payload}.${signPayload(payload, normalizedSecret)}`;
}

export function verifyPrivateMediaTicket(
  ticket: string,
  secret: string | undefined | null,
  expectedAudience: PrivateMediaTicketAudience,
  nowMs = Date.now(),
): PrivateMediaTicketVerifyResult {
  const normalizedSecret = normalizePrivateMediaTicketSecret(secret);
  if (!normalizedSecret) {
    return { ok: false, error: "CONFIG_MISSING" };
  }

  const [payload, signature, extra] = ticket.split(".");
  if (!payload || !signature || extra !== undefined) {
    return { ok: false, error: "MALFORMED" };
  }

  const expectedSignature = signPayload(payload, normalizedSecret);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expectedSignature);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return { ok: false, error: "BAD_SIGNATURE" };
  }

  let claims: unknown;
  try {
    claims = JSON.parse(base64UrlDecode(payload).toString("utf8"));
  } catch {
    return { ok: false, error: "MALFORMED" };
  }

  if (!isValidPrivateMediaTicketClaims(claims, expectedAudience)) {
    return { ok: false, error: "CLAIMS_INVALID" };
  }
  if (claims.audience !== expectedAudience) {
    return { ok: false, error: "AUDIENCE_MISMATCH" };
  }
  if (claims.exp <= nowMs) {
    return { ok: false, error: "EXPIRED" };
  }

  return { ok: true, claims };
}
