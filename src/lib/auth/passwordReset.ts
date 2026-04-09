import { createHash, randomBytes } from "node:crypto";

/** Default lifetime for a reset link (single use). */
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

export function generatePasswordResetSecret(): { rawToken: string; tokenHash: string } {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashPasswordResetToken(rawToken);
  return { rawToken, tokenHash };
}

export function hashPasswordResetToken(rawToken: string): string {
  return createHash("sha256").update(rawToken.trim(), "utf8").digest("hex");
}
