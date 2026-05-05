/**
 * Password reset email delivery.
 *
 * Uses Resend via direct fetch when configured.
 * Required in production: RESEND_API_KEY and PASSWORD_RESET_FROM.
 */
export type PasswordResetEmailInput = {
  to: string;
  resetUrl: string;
};

export type PasswordResetEmailResult =
  | { sent: true; provider: "resend"; id?: string }
  | { sent: false; provider: "resend"; reason: "missing_config" | "provider_error" };

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEV_FROM = "InfluSepet <onboarding@resend.dev>";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildPasswordResetEmail(resetUrl: string): { html: string; text: string } {
  const safeResetUrl = escapeHtml(resetUrl);
  return {
    html: `<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;padding:28px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
            <tr>
              <td style="padding:28px 28px 12px;">
                <p style="margin:0 0 8px;color:#4f46e5;font-size:13px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">InfluSepet</p>
                <h1 style="margin:0;color:#111827;font-size:24px;line-height:1.25;">Şifre sıfırlama bağlantınız</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:0 28px 24px;">
                <p style="margin:0 0 18px;color:#475569;font-size:15px;line-height:1.6;">
                  InfluSepet hesabınız için şifre sıfırlama isteği aldık. Yeni şifre belirlemek için aşağıdaki bağlantıyı kullanın.
                </p>
                <p style="margin:0 0 22px;">
                  <a href="${safeResetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:700;padding:12px 18px;border-radius:12px;">
                    Şifremi sıfırla
                  </a>
                </p>
                <p style="margin:0 0 12px;color:#64748b;font-size:13px;line-height:1.55;">
                  Bu bağlantı 1 saat boyunca geçerlidir ve yalnızca bir kez kullanılabilir.
                </p>
                <p style="margin:0;color:#64748b;font-size:13px;line-height:1.55;">
                  Bu isteği siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
                  Buton çalışmazsa bu bağlantıyı tarayıcınıza yapıştırın:<br>
                  <a href="${safeResetUrl}" style="color:#4f46e5;word-break:break-all;">${safeResetUrl}</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: [
      "InfluSepet şifre sıfırlama bağlantınız",
      "",
      "InfluSepet hesabınız için şifre sıfırlama isteği aldık.",
      "Yeni şifre belirlemek için bu bağlantıyı kullanın:",
      resetUrl,
      "",
      "Bu bağlantı 1 saat boyunca geçerlidir ve yalnızca bir kez kullanılabilir.",
      "Bu isteği siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.",
    ].join("\n"),
  };
}

export async function sendPasswordResetEmail(input: PasswordResetEmailInput): Promise<PasswordResetEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const configuredFrom = process.env.PASSWORD_RESET_FROM?.trim();
  const from = configuredFrom || (process.env.NODE_ENV === "development" ? DEV_FROM : "");

  if (process.env.NODE_ENV === "development") {
    console.info("[password-reset] Development reset URL:", input.resetUrl);
  }

  if (!apiKey || !from) {
    console.warn("[password-reset] Email not sent: missing Resend configuration.", {
      hasApiKey: Boolean(apiKey),
      hasFrom: Boolean(from),
      environment: process.env.NODE_ENV,
    });
    return { sent: false, provider: "resend", reason: "missing_config" };
  }

  const email = buildPasswordResetEmail(input.resetUrl);

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "User-Agent": "influsepet/1.0",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: "InfluSepet şifre sıfırlama bağlantısı",
        html: email.html,
        text: email.text,
      }),
    });

    const data = (await res.json().catch(() => null)) as { id?: unknown; message?: unknown; name?: unknown } | null;

    if (!res.ok) {
      console.warn("[password-reset] Resend email send failed.", {
        status: res.status,
        providerError: typeof data?.message === "string" ? data.message : undefined,
        providerErrorName: typeof data?.name === "string" ? data.name : undefined,
      });
      return { sent: false, provider: "resend", reason: "provider_error" };
    }

    return {
      sent: true,
      provider: "resend",
      id: typeof data?.id === "string" ? data.id : undefined,
    };
  } catch (error) {
    console.warn("[password-reset] Resend email request failed.", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    return { sent: false, provider: "resend", reason: "provider_error" };
  }
}
