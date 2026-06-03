"use client";

import { useState } from "react";
import type { SocialAccountVerificationStatus } from "@prisma/client";
import { SocialVerificationBadge } from "./SocialVerificationBadge";

type VerifyIntent = "generate" | "submit";

function statusMessage(status: SocialAccountVerificationStatus): string | null {
  switch (status) {
    case "PENDING":
      return "Doğrulama talebiniz inceleme bekliyor.";
    case "VERIFIED":
      return "Sosyal hesap doğrulandı.";
    case "REJECTED":
      return "Doğrulama kodu biyografinizde görülemedi. Lütfen kodu ekleyip tekrar deneyin.";
    case "EXPIRED":
      return "Doğrulama kodunun süresi doldu. Yeni bir kod oluşturabilirsiniz.";
    case "UNVERIFIED":
    default:
      return null;
  }
}

export function VerifySocialAccountForm({
  socialAccountId,
  verificationCode,
  verificationStatus,
  onVerified,
}: {
  socialAccountId: string;
  verificationCode: string | null;
  verificationStatus: SocialAccountVerificationStatus;
  onVerified: () => void;
}) {
  const [loadingIntent, setLoadingIntent] = useState<VerifyIntent | null>(null);
  const [error, setError] = useState<string | null>(null);

  const message = statusMessage(verificationStatus);
  const canGenerate = verificationStatus === "EXPIRED" || !verificationCode;
  const canSubmit =
    Boolean(verificationCode) &&
    verificationStatus !== "PENDING" &&
    verificationStatus !== "VERIFIED" &&
    verificationStatus !== "EXPIRED";

  async function runIntent(intent: VerifyIntent) {
    setLoadingIntent(intent);
    setError(null);
    try {
      const res = await fetch("/api/social-accounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialAccountId, intent }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "İşlem tamamlanamadı.");
        return;
      }
      onVerified();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoadingIntent(null);
    }
  }

  return (
    <div className={`social-verify-panel social-verify-panel--${verificationStatus.toLowerCase()}`}>
      <div className="social-verify-panel__head">
        <div>
          <p className="social-verify-panel__title">Sosyal hesap doğrulama</p>
          <p className="social-verify-panel__intro muted">
            Sosyal hesabınızı doğrulamak için size özel oluşturulan kodu Instagram veya TikTok biyografinize geçici
            olarak ekleyin. Kod göründükten sonra inceleme talebi gönderebilirsiniz.
          </p>
        </div>
        <SocialVerificationBadge status={verificationStatus} />
      </div>

      {message ? <p className="social-verify-panel__status muted">{message}</p> : null}

      {verificationCode ? (
        <div className="social-verify-panel__code-block">
          <span className="social-verify-panel__code-label">Doğrulama kodunuz:</span>
          <code className="social-verify-panel__code" translate="no">
            {verificationCode}
          </code>
        </div>
      ) : null}

      <p className="social-verify-panel__note muted">
        Kod yalnızca hesabın size ait olduğunu doğrulamak için kullanılır. Onaylandıktan sonra kodu biyografinizden
        kaldırabilirsiniz.
      </p>

      {error ? <p className="social-verify-panel__error">{error}</p> : null}

      <div className="social-verify-panel__actions">
        {canGenerate ? (
          <button
            className="btn secondary"
            type="button"
            disabled={loadingIntent !== null}
            onClick={() => void runIntent("generate")}
          >
            {loadingIntent === "generate" ? "…" : "Hesabı doğrula"}
          </button>
        ) : null}
        {canSubmit ? (
          <button
            className="btn"
            type="button"
            disabled={loadingIntent !== null}
            onClick={() => void runIntent("submit")}
          >
            {loadingIntent === "submit" ? "…" : "İncelemeye gönder"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
