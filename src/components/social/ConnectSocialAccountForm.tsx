"use client";

import { useState } from "react";
import { SocialPlatform } from "@prisma/client";

const PLATFORM_OPTIONS_PRIMARY: { value: SocialPlatform; label: string }[] = [
  { value: "INSTAGRAM", label: "Instagram" },
  { value: "TIKTOK", label: "TikTok" },
];

const PLATFORM_OPTIONS_SECONDARY: { value: SocialPlatform; label: string }[] = [
  { value: "YOUTUBE", label: "YouTube" },
];

export function ConnectSocialAccountForm({ onConnected }: { onConnected: () => void }) {
  const [platform, setPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [usernameOrUrl, setUsernameOrUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = usernameOrUrl.trim();
    if (!trimmed) {
      setError("Kullanıcı adı veya profil bağlantısı girin.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const res = await fetch("/api/social-accounts/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, usernameOrUrl: trimmed }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        if (res.status === 409) {
          setError(data.error ?? "Bu hesap başka bir kullanıcıya bağlı.");
        } else {
          setError(data.error ?? "Hesap bağlanamadı.");
        }
        return;
      }
      setSuccess(true);
      setUsernameOrUrl("");
      onConnected();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="social-connect-toolbar" onSubmit={handleSubmit}>
      <div className="social-connect-toolbar__head">
        <p className="social-connect-toolbar__head-title">Yeni hesap bağla</p>
        <p className="social-connect-toolbar__head-hint muted">
          Öncelikle Instagram veya TikTok bağlamanız önerilir; YouTube isteğe bağlıdır. Kullanıcı adı veya profil
          URL’sini girin.
        </p>
      </div>
      <div className="social-connect-toolbar__inner">
        <div className="social-connect-toolbar__field">
          <label htmlFor="social-platform">Platform</label>
          <select
            id="social-platform"
            className="social-select social-connect-toolbar__select"
            value={platform}
            onChange={(e) => setPlatform(e.target.value as SocialPlatform)}
            disabled={loading}
          >
            <optgroup label="Önerilen">
              {PLATFORM_OPTIONS_PRIMARY.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </optgroup>
            <optgroup label="İsteğe bağlı">
              {PLATFORM_OPTIONS_SECONDARY.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          </select>
        </div>
        <div className="social-connect-toolbar__field social-connect-toolbar__field--grow">
          <label htmlFor="social-username-url">Kullanıcı adı veya profil bağlantısı</label>
          <input
            id="social-username-url"
            type="text"
            value={usernameOrUrl}
            onChange={(e) => setUsernameOrUrl(e.target.value)}
            disabled={loading}
            placeholder="@kullanici veya profil URL’si"
            autoComplete="off"
          />
        </div>
        <div className="social-connect-toolbar__submit">
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "Bağlanıyor…" : "Hesap bağla"}
          </button>
        </div>
      </div>

      {error ? <p className="social-connect-toolbar__msg social-connect-toolbar__msg--error">{error}</p> : null}
      {success ? (
        <p className="social-connect-toolbar__msg social-connect-toolbar__msg--success">
          Hesap bağlandı. Doğrulama kodunu aşağıda kullanabilirsiniz.
        </p>
      ) : null}
    </form>
  );
}
