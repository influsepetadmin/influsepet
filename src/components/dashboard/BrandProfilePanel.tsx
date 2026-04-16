"use client";

import Link from "next/link";
import { useState } from "react";
import BrandProfileForm from "@/components/BrandProfileForm";

export function BrandProfilePanel({
  err,
  profileComplete,
  displayName,
  initial,
  isExistingProfile,
  summary,
}: {
  err: string | null | undefined;
  profileComplete: boolean;
  displayName: string;
  initial: {
    companyName: string;
    city: string;
    website: string;
    profileImageUrl: string;
    username: string;
    bio: string;
    selectedCategoryKeys: string[];
  };
  isExistingProfile: boolean;
  summary: {
    imageSrc: string;
    companyName: string;
    city: string;
    websiteUrl: string | null;
    publicUsername: string | null;
  };
}) {
  const hasErr = Boolean(err?.trim());
  const [editing, setEditing] = useState(() => !profileComplete || hasErr);

  const showForm = !profileComplete || hasErr || editing;

  return (
    <>
      {err ? <p className="auth-alert">{err}</p> : null}

      {profileComplete ? (
        <div className="dashboard-profile-summary dashboard-profile-summary--brand">
          <div className="dashboard-profile-summary__card">
          <div className="profile-public-hero">
            <img
              className="profile-public-avatar profile-public-avatar--brand"
              src={summary.imageSrc}
              alt=""
            />
            <div className="profile-stat-grid">
              <p className="profile-public-handle" style={{ marginBottom: 4 }}>
                {summary.companyName}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                {displayName}
              </p>
              <p className="muted" style={{ margin: 0 }}>
                Şehir: {summary.city || "—"}
              </p>
              {summary.publicUsername ? (
                <p style={{ margin: "6px 0 0" }}>
                  <Link className="btn secondary btn--sm" href={`/brand/${encodeURIComponent(summary.publicUsername)}`}>
                    Herkese açık profili görüntüle
                  </Link>
                </p>
              ) : (
                <p className="muted" style={{ margin: "6px 0 0", fontSize: "0.88rem" }}>
                  Herkese açık profil için kullanıcı adı ekleyin.
                </p>
              )}
              {summary.websiteUrl ? (
                <p style={{ margin: 0 }}>
                  <a href={summary.websiteUrl} target="_blank" rel="noreferrer">
                    Web sitesi
                  </a>
                </p>
              ) : (
                <p className="muted" style={{ margin: 0 }}>
                  Web sitesi eklenmedi
                </p>
              )}
            </div>
          </div>
          </div>
          <p className="dashboard-profile-summary__hint muted">
            Profil bilgileriniz tamamlandı. İsterseniz düzenleyebilirsiniz.
          </p>
          {!hasErr ? (
            <button
              type="button"
              className="btn secondary btn--subtle"
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? "Düzenlemeyi kapat" : "Profili düzenle"}
            </button>
          ) : null}
        </div>
      ) : null}

      {showForm ? (
        <div style={{ marginTop: profileComplete ? 14 : 0 }}>
          <BrandProfileForm initial={initial} isExistingProfile={isExistingProfile} />
        </div>
      ) : null}
    </>
  );
}
