"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type AuthRole = "BRAND" | "INFLUENCER";
export type AuthMode = "login" | "register";
export type AuthLandingBasePath = "/" | "/giris";

export function UnifiedAuthEntry({
  initialRole,
  initialMode,
  initialErr,
  basePath,
}: {
  initialRole: AuthRole;
  initialMode: AuthMode;
  initialErr: string | null;
  basePath: AuthLandingBasePath;
}) {
  const router = useRouter();
  const [role, setRole] = useState<AuthRole>(initialRole);
  const [mode, setMode] = useState<AuthMode>(initialMode);

  function syncUrl(nextRole: AuthRole, nextMode: AuthMode) {
    setRole(nextRole);
    setMode(nextMode);
    const p = new URLSearchParams();
    p.set("role", nextRole);
    p.set("mode", nextMode);
    router.replace(`${basePath}?${p.toString()}`, { scroll: false });
  }

  const errBox =
    initialErr != null && initialErr !== "" ? (
      <p className="auth-alert" role="alert">
        {initialErr}
      </p>
    ) : null;

  const secondaryFooter =
    basePath === "/giris" ? (
      <p className="auth-card-foot muted">
        <Link href="/">Ana sayfa</Link>
      </p>
    ) : null;

  return (
    <div className="auth-card auth-card--compact">
      <div className="auth-card-head">
        <h2 className="auth-card-heading">{mode === "login" ? "Giriş" : "Kayıt"}</h2>
        <p className="auth-card-subline muted">
          {mode === "login"
            ? "Rolünü seçip hesabına giriş yap."
            : "Rolünü seçerek yeni hesap oluştur."}
        </p>
      </div>

      <p className="auth-section-label">Rolünü seç</p>
      <div className="auth-role-segment" role="group" aria-label="Hesap rolü">
        <button
          type="button"
          className={`auth-segment-btn ${role === "INFLUENCER" ? "active" : ""}`}
          onClick={() => syncUrl("INFLUENCER", mode)}
          aria-pressed={role === "INFLUENCER"}
        >
          Influencer
        </button>
        <button
          type="button"
          className={`auth-segment-btn ${role === "BRAND" ? "active" : ""}`}
          onClick={() => syncUrl("BRAND", mode)}
          aria-pressed={role === "BRAND"}
        >
          Marka
        </button>
      </div>

      {errBox}

      {mode === "login" ? (
        <>
          <form action="/api/auth/login" method="post" className="auth-form" autoComplete="on">
            <input type="hidden" name="roleHint" value={role} />
            <input type="hidden" name="authReturn" value={basePath} />

            <label htmlFor="login-email">E-posta</label>
            <input
              id="login-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
            />

            <label htmlFor="login-password">Şifre</label>
            <input
              id="login-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />

            <div className="auth-primary-action">
              <button className="btn" type="submit">
                Giriş Yap
              </button>
            </div>
          </form>

          <button
            type="button"
            className="auth-secondary-switch"
            onClick={() => syncUrl(role, "register")}
          >
            Kayıt Ol
          </button>
        </>
      ) : (
        <>
          <form action="/api/auth/register" method="post" className="auth-form" autoComplete="on">
            <input type="hidden" name="role" value={role} />
            <input type="hidden" name="authReturn" value={basePath} />

            <label htmlFor="reg-name">Ad Soyad</label>
            <input id="reg-name" name="name" type="text" autoComplete="name" required />

            <label htmlFor="reg-email">E-posta</label>
            <input
              id="reg-email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
            />

            {role === "BRAND" ? (
              <>
                <label htmlFor="companyName">Şirket / Marka adı</label>
                <input
                  id="companyName"
                  name="companyName"
                  type="text"
                  autoComplete="organization"
                  required
                />
              </>
            ) : (
              <>
                <label htmlFor="username">Kullanıcı adı (benzersiz)</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  minLength={3}
                  pattern="[a-zA-Z0-9_]+"
                  title="Harf, rakam ve alt çizgi"
                  autoComplete="username"
                />
              </>
            )}

            <label htmlFor="reg-password">Şifre</label>
            <input
              id="reg-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
            />

            <div className="auth-primary-action">
              <button className="btn" type="submit">
                Kayıt ol
              </button>
            </div>
          </form>

          <button
            type="button"
            className="auth-secondary-switch"
            onClick={() => syncUrl(role, "login")}
          >
            Zaten hesabın var mı? Giriş yap
          </button>
        </>
      )}

      {secondaryFooter}
    </div>
  );
}
