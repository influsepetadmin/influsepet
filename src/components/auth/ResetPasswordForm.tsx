"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/passwordConstants";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Şifreler eşleşmiyor.");
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.`);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError(typeof data?.error === "string" ? data.error : "Şifre güncellenemedi.");
        return;
      }
      router.replace("/?mode=login");
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <p className="auth-alert" role="alert">
        Geçerli bir sıfırlama bağlantısı yok. Yeni istek oluşturmak için &quot;Şifremi unuttum&quot; sayfasını
        kullanın.
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
      <label htmlFor="reset-password">Yeni şifre</label>
      <input
        id="reset-password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={busy}
      />
      <label htmlFor="reset-password-confirm">Yeni şifre tekrar</label>
      <input
        id="reset-password-confirm"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        required
        minLength={MIN_PASSWORD_LENGTH}
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        disabled={busy}
      />
      <div className="auth-primary-action">
        <button className="btn" type="submit" disabled={busy}>
          {busy ? "Kaydediliyor…" : "Şifreyi kaydet"}
        </button>
      </div>
    </form>
  );
}
