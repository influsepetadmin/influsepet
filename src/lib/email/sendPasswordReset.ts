/**
 * Password reset email delivery.
 *
 * Not wired to a real provider yet. For production:
 * - Set e.g. RESEND_API_KEY or SMTP_* env vars and send HTML/text mail with `resetUrl`.
 * - Keep the same function signature so API routes stay unchanged.
 */
export type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<{ sent: boolean }> {
  if (process.env.NODE_ENV === "development") {
    console.info("[password-reset] Email not sent (no provider). Reset URL:", input.resetUrl);
  }
  // TODO: integrate Resend, SES, Nodemailer, etc. when credentials exist
  return { sent: false };
}
