"use client";

import { useState } from "react";

export function VerifySocialAccountForm({
  socialAccountId,
  verificationCode,
  onVerified,
}: {
  socialAccountId: string;
  verificationCode: string | null;
  onVerified: () => void;
}) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!verificationCode) {
    return (
      <p className="social-verify-panel social-verify-panel--notice muted">
        Yeni bir doğrulama kodu için hesabı yeniden bağlayın.
      </p>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("Doğrulama kodunu girin.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/social-accounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socialAccountId, providedCode: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Kod doğrulanamadı.");
        return;
      }
      setCode("");
      onVerified();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="social-verify-panel">
      <p className="social-verify-panel__intro muted">
        <strong className="social-verify-panel__intro-strong">Manuel doğrulama:</strong> Aşağıdaki kodu kaydedin ve
        doğrulama adımında girin. İleride OAuth veya biyografi doğrulaması eklenecektir.
      </p>

      <div className="social-verify-panel__code-block">
        <span className="social-verify-panel__code-label">Doğrulama kodu</span>
        <code className="social-verify-panel__code" translate="no">
          {verificationCode}
        </code>
      </div>

      <form className="social-verify-panel__form" onSubmit={handleSubmit}>
        <label htmlFor={`verify-${socialAccountId}`} className="social-verify-panel__label">
          Kodu buraya girin
        </label>
        <input
          id={`verify-${socialAccountId}`}
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          disabled={loading}
          autoComplete="off"
          className="social-verify-panel__input"
        />
        {error ? <p className="social-verify-panel__error">{error}</p> : null}
        <div className="social-verify-panel__actions">
          <button className="btn secondary" type="submit" disabled={loading}>
            {loading ? "…" : "Doğrula"}
          </button>
        </div>
      </form>
    </div>
  );
}
