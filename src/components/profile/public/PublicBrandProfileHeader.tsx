import type { ReactNode } from "react";
import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { getAvatarUrl } from "@/lib/avatar";
import { CategoryBadgeGroup } from "./CategoryBadgeGroup";
import { PublicRecentReviewsSection } from "./PublicRecentReviewsSection";

function safeWebsiteHref(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function PublicBrandProfileHeader({
  data,
  cta,
}: {
  data: PublicBrandProfileResponse;
  /** Dahili profil vb.: varsayılan “yakında” CTA yerine özel aksiyonlar. */
  cta?: ReactNode;
}) {
  const avatarSrc = data.avatarUrl?.trim() || getAvatarUrl(data.id);
  const socialVerifiedCount = data.verifiedSocialAccounts.length;
  const webHref = data.website ? safeWebsiteHref(data.website) : null;

  return (
    <div className="public-profile-brand-hero-wrap">
      <header className="public-profile-hero public-profile-hero--brand public-profile-hero--brand-rich">
        <div className="public-profile-brand-cover" aria-hidden />
        <div className="public-profile-brand-hero-inner">
          <div className="public-profile-hero__avatar-wrap">
            <div className="public-profile-hero__avatar-ring public-profile-hero__avatar-ring--brand">
              <img className="public-profile-hero__avatar" src={avatarSrc} alt="" width={144} height={144} />
            </div>
          </div>
          <div className="public-profile-hero__main">
            <div className="public-profile-hero__title-row">
              <h1 className="public-profile-hero__name">{data.name}</h1>
              <span className="public-profile-role-badge public-profile-role-badge--brand">Marka</span>
            </div>
            <p className="public-profile-hero__handle muted">@{data.username}</p>

            {data.contactName?.trim() && data.contactName.trim() !== data.name.trim() ? (
              <p className="public-profile-hero__contact muted">{data.contactName.trim()}</p>
            ) : null}

            <CategoryBadgeGroup bare categories={data.categories} nicheText={null} sectionTitle="Sektör" />

            {data.bio?.trim() ? (
              <div className="public-profile-brand-about">
                <p className="public-profile-brand-about__label">Hakkında</p>
                <p className="public-profile-hero__bio public-profile-hero__bio--prose public-profile-brand-about__text">
                  {data.bio.trim()}
                </p>
              </div>
            ) : null}

            <div className="public-profile-hero__meta public-profile-hero__meta--brand-row">
              {data.city?.trim() ? (
                <p className="public-profile-hero__meta-line muted">
                  <span className="public-profile-hero__meta-icon" aria-hidden>
                    ◎
                  </span>
                  {data.city.trim()}
                </p>
              ) : null}
              {webHref ? (
                <p className="public-profile-hero__meta-line public-profile-hero__meta-line--web">
                  <a
                    href={webHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="public-profile-hero__web-link"
                  >
                    Web sitesi
                  </a>
                </p>
              ) : null}
              {socialVerifiedCount > 0 ? (
                <p className="public-profile-hero__meta-line public-profile-hero__meta-line--trust muted">
                  <span className="public-profile-hero__trust-pill" aria-hidden>
                    ✓
                  </span>
                  {socialVerifiedCount} doğrulanmış sosyal hesap
                </p>
              ) : null}
            </div>

            <PublicRecentReviewsSection reviews={data.recentPublicReviews} />

            {cta != null ? (
              <div className="public-profile-hero__cta public-profile-hero__cta--brand-panel">{cta}</div>
            ) : (
              <div className="public-profile-hero__cta">
                <button type="button" className="btn public-profile-hero__cta-btn" disabled>
                  İş birliği teklifi gönder
                </button>
                <p className="public-profile-hero__cta-hint">Bu özellik yakında etkinleşecek.</p>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
}
