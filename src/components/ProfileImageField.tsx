"use client";

import { useRef, useState } from "react";
import { isStockProfileImageUrl } from "@/lib/avatar";

type Props = {
  initialUrl: string;
  inputId?: string;
  name?: string;
};

function normalizeInitialProfileUrl(raw: string): string {
  const t = raw.trim();
  if (!t || isStockProfileImageUrl(t)) return "";
  return raw;
}

function ProfileImagePlaceholder() {
  return (
    <div className="profile-image-field__placeholder" aria-hidden>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="42"
        height="42"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.45"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="profile-image-field__placeholder-icon"
      >
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
      </svg>
      <span className="profile-image-field__placeholder-label">Fotoğraf yükleyin</span>
    </div>
  );
}

export default function ProfileImageField({
  initialUrl,
  inputId = "profileImageUrl",
  name = "profileImageUrl",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(() => normalizeInitialProfileUrl(initialUrl));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = url.trim();
  const hasRealImage = Boolean(trimmed) && !isStockProfileImageUrl(trimmed);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/uploads/profile-image", {
        method: "POST",
        body: fd,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; url?: string };
      if (!res.ok) {
        setError(data.error ?? "Yukleme basarisiz.");
        return;
      }
      if (data.url) {
        setUrl(data.url);
      }
    } catch {
      setError("Baglanti hatasi. Tekrar deneyin.");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  }

  return (
    <div style={{ marginBottom: 8 }}>
      <label htmlFor={inputId}>Profil resmi (opsiyonel)</label>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          alignItems: "flex-start",
          marginTop: 8,
        }}
      >
        <div
          className={`profile-image-field__preview${hasRealImage ? "" : " profile-image-field__preview--empty"}`}
          style={{
            width: 96,
            height: 96,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid var(--border)",
            flexShrink: 0,
          }}
        >
          {hasRealImage ? (
            <img
              src={trimmed}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <ProfileImagePlaceholder />
          )}
        </div>
        <div style={{ flex: "1 1 200px", minWidth: 0 }}>
          <input
            type="file"
            ref={fileRef}
            accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            style={{ display: "none" }}
            onChange={onFileChange}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            <button
              type="button"
              className="btn secondary"
              disabled={loading}
              onClick={() => fileRef.current?.click()}
            >
              {loading ? "Yükleniyor..." : "Fotoğraf yükle"}
            </button>
          </div>
          {error && (
            <p
              className="muted"
              style={{
                marginTop: 8,
                marginBottom: 0,
                color: "#b91c1c",
                fontSize: "0.88rem",
              }}
            >
              {error}
            </p>
          )}
          <label htmlFor={inputId} style={{ display: "block", marginTop: 12 }}>
            Veya URL yapıştırın (http/https veya yuklenen dosya yolu)
          </label>
          <input
            id={inputId}
            name={name}
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setError(null);
            }}
            placeholder="https://... veya /uploads/profile-images/..."
            autoComplete="off"
            style={{ marginTop: 6, width: "100%", maxWidth: "100%" }}
          />
        </div>
      </div>
    </div>
  );
}
