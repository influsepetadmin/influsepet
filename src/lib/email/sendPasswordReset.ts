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
  <body style="margin:0;padding:0;background:#f6f7fb;color:#111827;font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      InfluSepet hesabınız için güvenli şifre sıfırlama bağlantınız.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7fb;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:580px;background:#ffffff;border:1px solid #e4e7f0;border-radius:22px;overflow:hidden;box-shadow:0 18px 48px rgba(15,23,42,0.08);">
            <tr>
              <td style="padding:30px 32px 20px;background:linear-gradient(135deg,#fafaff 0%,#ffffff 58%,#f5f3ff 100%);border-bottom:1px solid #eef0f6;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td>
                      <p style="margin:0;color:#4f46e5;font-size:18px;font-weight:800;letter-spacing:-0.01em;">InfluSepet</p>
                      <p style="margin:6px 0 0;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">Hesap güvenliği</p>
                    </td>
                    <td align="right" style="vertical-align:top;">
                      <span style="display:inline-block;padding:7px 11px;border-radius:999px;background:#eef2ff;color:#3730a3;border:1px solid #c7d2fe;font-size:12px;font-weight:700;">1 saat geçerli</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:30px 32px 10px;">
                <h1 style="margin:0 0 14px;color:#111827;font-size:25px;line-height:1.25;letter-spacing:-0.02em;">Şifrenizi güvenle yenileyin</h1>
                <p style="margin:0 0 22px;color:#475569;font-size:15px;line-height:1.65;">
                  InfluSepet hesabınız için şifre sıfırlama isteği aldık. Yeni şifre belirlemek için aşağıdaki güvenli bağlantıyı kullanabilirsiniz.
                </p>
                <p style="margin:0 0 24px;">
                  <a href="${safeResetUrl}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:15px;font-weight:800;padding:14px 20px;border-radius:13px;box-shadow:0 10px 24px rgba(79,70,229,0.24);">
                    Şifremi sıfırla
                  </a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 26px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                  <tr>
                    <td style="padding:16px 18px;">
                      <p style="margin:0 0 8px;color:#334155;font-size:13px;font-weight:800;">Güvenlik notu</p>
                      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">
                        Bu bağlantı 1 saat boyunca geçerlidir ve yalnızca bir kez kullanılabilir. Bu isteği siz başlatmadıysanız bu e-postayı yok sayabilirsiniz.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px 26px;background:#fbfcff;border-top:1px solid #eef0f6;">
                <p style="margin:0 0 8px;color:#64748b;font-size:13px;line-height:1.55;">
                  Buton çalışmazsa bağlantıyı tarayıcınıza yapıştırın:
                </p>
                <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.55;">
                  <a href="${safeResetUrl}" style="color:#4f46e5;text-decoration:underline;word-break:break-all;">${safeResetUrl}</a>
                </p>
              </td>
            </tr>
          </table>
          <p style="max-width:520px;margin:16px 0 0;color:#94a3b8;font-size:12px;line-height:1.5;">
            InfluSepet, marka ve influencer iş birlikleri için güvenli çalışma alanı.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`,
    text: [
      "InfluSepet | Şifre sıfırlama bağlantınız",
      "",
      "InfluSepet hesabınız için şifre sıfırlama isteği aldık. Yeni şifre belirlemek için aşağıdaki güvenli bağlantıyı kullanabilirsiniz.",
      "",
      "Şifremi sıfırla:",
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
