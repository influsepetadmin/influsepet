"use client";

import { useState } from "react";
import InfluencerProfileForm from "@/components/InfluencerProfileForm";

export function InfluencerProfilePanel({
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
    username: string;
    followerCount: number;
    basePriceTRY: number;
    city: string;
    profileImageUrl: string;
    selectedCategoryKeys: string[];
    instagramUrl: string;
    tiktokUrl: string;
    nicheText: string;
  };
  isExistingProfile: boolean;
  summary: {
    imageSrc: string;
    username: string;
    city: string;
    followerCount: number;
    basePriceTRY: number;
    categoriesText: string;
    nichePreview: string | null;
    bioPreview: string | null;
  };
}) {
  const hasErr = Boolean(err?.trim());
  const [editing, setEditing] = useState(() => !profileComplete || hasErr);

  const showForm = !profileComplete || hasErr || editing;

  return (
    <>
      {err ? <p className="auth-alert">{err}</p> : null}

      {profileComplete ? (
        <div className="dashboard-profile-summary dashboard-profile-summary--influencer">
          <div className="dashboard-profile-summary__card">
          <div className="profile-public-hero">
            <img className="profile-public-avatar" src={summary.imageSrc} alt="" />
            <div className="influencer-profile-meta">
              <p className="profile-public-handle influencer-profile-meta__handle">@{summary.username}</p>
              <p className="muted influencer-profile-meta__name">{displayName}</p>
              <div className="influencer-profile-meta__grid">
                <div className="influencer-profile-meta__item">
                  <span className="influencer-profile-meta__label">Şehir</span>
                  <span className="influencer-profile-meta__value">{summary.city || "—"}</span>
                </div>
                <div className="influencer-profile-meta__item">
                  <span className="influencer-profile-meta__label">Takipçi</span>
                  <span className="influencer-profile-meta__value">
                    {summary.followerCount.toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="influencer-profile-meta__item">
                  <span className="influencer-profile-meta__label">Baz fiyat</span>
                  <span className="influencer-profile-meta__value">{summary.basePriceTRY} TRY</span>
                </div>
              </div>
              <p className="muted influencer-profile-meta__categories">
                <span className="influencer-profile-meta__label">Kategoriler</span>
                {summary.categoriesText || "—"}
              </p>
              {summary.nichePreview ? (
                <p className="muted influencer-profile-meta__niche">
                  <span className="influencer-profile-meta__label">Niş</span>
                  {summary.nichePreview}
                </p>
              ) : null}
              {summary.bioPreview ? (
                <p className="influencer-profile-meta__bio">{summary.bioPreview}</p>
              ) : null}
            </div>
          </div>
          </div>
          <p className="dashboard-profile-summary__hint muted">
            Profil bilgileriniz kayıtlı. İsterseniz düzenleyebilirsiniz.
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
          <InfluencerProfileForm initial={initial} isExistingProfile={isExistingProfile} />
        </div>
      ) : null}
    </>
  );
}
