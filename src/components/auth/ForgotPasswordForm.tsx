"use client";

import { useState } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !data?.ok) {
        setError("İstek gönderilemedi. Bir süre sonra tekrar deneyin.");
        return;
      }
      setDone(true);
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="auth-reset-success muted" role="status">
        Talebiniz alındı. E-posta adresi kayıtlıysa, şifre sıfırlama bağlantısı gönderilir. Gelen kutunuzu ve spam
        klasörünü kontrol edin.
      </p>
    );
  }

  return (
    <form className="auth-form" onSubmit={(e) => void onSubmit(e)} autoComplete="on">
      {error ? (
        <p className="auth-alert" role="alert">
          {error}
        </p>
      ) : null}
      <label htmlFor="forgot-email">E-posta</label>
      <input
        id="forgot-email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={busy}
      />
      {process.env.NODE_ENV === "development" ? (
        <p className="auth-reset-dev-hint muted">
          Geliştirme: e-posta gönderilmez; sıfırlama URL’si sunucu konsoluna yazılır.
        </p>
      ) : null}
      <div className="auth-primary-action">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}
        </button>
      </div>
    </form>
  );
}
