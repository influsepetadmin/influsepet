"use client";

import { useRef, useState } from "react";

type Props = {
  initialUrl: string;
  /** Shown when URL is empty (e.g. deterministic avatar). */
  fallbackPreviewUrl?: string;
  inputId?: string;
  name?: string;
};

export default function ProfileImageField({
  initialUrl,
  fallbackPreviewUrl,
  inputId = "profileImageUrl",
  name = "profileImageUrl",
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = url.trim();
  const previewSrc = trimmed || fallbackPreviewUrl || undefined;

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
          style={{
            width: 96,
            height: 96,
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid #e2e8f0",
            background: "#f3f4f6",
            flexShrink: 0,
          }}
        >
          {previewSrc ? (
            <img
              src={previewSrc}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                color: "#9ca3af",
                padding: 8,
                textAlign: "center",
              }}
            >
              Onizleme yok
            </div>
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
