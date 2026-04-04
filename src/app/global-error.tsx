"use client";

import "./globals.css";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <html lang="tr">
      <body className="global-error-body">
        <div className="error-state-page error-state-page--global">
          <div className="error-state-card card">
            <div className="error-state-brand">
              <Image
                src="/branding/logo-primary.png"
                alt=""
                width={56}
                height={56}
                className="error-state-logo"
                sizes="56px"
              />
              <span className="error-state-brand-name">InfluSepet</span>
            </div>
            <h1 className="error-state-title">Uygulama şu anda kullanılamıyor</h1>
            <p className="error-state-desc muted">
              Beklenmeyen bir sistem hatası oluştu. Lütfen daha sonra tekrar deneyin.
            </p>
            <div className="error-state-actions">
              <Link className="btn" href="/">
                Ana sayfaya dön
              </Link>
              <button type="button" className="btn secondary" onClick={() => window.location.reload()}>
                Sayfayı yenile
              </button>
            </div>
            <p className="error-state-foot muted">Destek: destek@influsepet.com</p>
          </div>
        </div>
      </body>
    </html>
  );
}
