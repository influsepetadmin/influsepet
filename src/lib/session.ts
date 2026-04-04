import { cookies } from "next/headers";
import crypto from "node:crypto";

const COOKIE_NAME = "influsepet_session";
const MAX_AGE_SEC = 60 * 60 * 24 * 7;

const MIN_PRODUCTION_SECRET_LENGTH = 32;

function getSecret(): string {
  const s = process.env.SESSION_SECRET;
  if (process.env.NODE_ENV === "production") {
    if (!s || s.length < MIN_PRODUCTION_SECRET_LENGTH) {
      throw new Error(
        "FATAL: SESSION_SECRET is required in production. Set a strong random value " +
          `(at least ${MIN_PRODUCTION_SECRET_LENGTH} characters) in the server environment. ` +
          "Example: openssl rand -base64 48",
      );
    }
    return s;
  }
  return s || "dev-only-insecure-session-secret-not-for-production";
}

export type SessionPayload = { uid: string; exp: number };

function sign(payload: string): string {
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

export async function setSessionCookie(uid: string) {
  const exp = Math.floor(Date.now() / 1000) + MAX_AGE_SEC;
  const payload = Buffer.from(JSON.stringify({ uid, exp } satisfies SessionPayload), "utf8").toString(
    "base64url",
  );
  const token = `${payload}.${sign(payload)}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SEC,
  });
}

export async function getSessionPayload(): Promise<SessionPayload | null> {
  const raw = (await cookies()).get(COOKIE_NAME)?.value;
  if (!raw || !raw.includes(".")) return null;
  const [payload, sig] = raw.split(".");
  if (!payload || sign(payload) !== sig) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;
    if (!data?.uid || !data?.exp) return null;
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function clearSessionCookie() {
  (await cookies()).delete(COOKIE_NAME);
}
