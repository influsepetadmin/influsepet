import type { ReactNode } from "react";
import Link from "next/link";
import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { getAvatarUrl } from "@/lib/avatar";
import {
  PublicProfileIconArrowTopRightOnSquare,
  PublicProfileIconMapPin,
  PublicProfileIconShieldCheck,
} from "./publicProfileInfluencerIcons";
import { PublicInfluencerBrandOfferCta } from "./PublicInfluencerBrandOfferCta";

function safeWebsiteHref(url: string): string | null {
  const t = url.trim();
  if (!t) return null;
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

function sectorLeadLine(data: PublicBrandProfileResponse): string | null {
  if (data.categories.length === 0) return null;
  return data.categories
    .slice(0, 4)
    .map((c) => c.label)
    .join(" · ");
}

/**
 * Üst kimlik + CTA; detay metinleri iki sütun düzeninde aside’da.
 */
export function PublicBrandProfileHeader({
  data,
  cta,
  isOwnPublicProfile,
  chatHref,
  viewerRole,
}: {
  data: PublicBrandProfileResponse;
  /** Dahili profil vb.: varsayılan CTA yerine özel aksiyonlar. */
  cta?: ReactNode;
  /** Kendi herkese açık profil: kendine teklif CTA’sı gösterilmez. */
  isOwnPublicProfile: boolean;
  chatHref?: string | null;
  viewerRole?: "INFLUENCER" | "BRAND" | null;
}) {
  const avatarSrc = data.avatarUrl?.trim() || getAvatarUrl(data.id);
  const socialVerifiedCount = data.verifiedSocialAccounts.length;
  const webHref = data.website ? safeWebsiteHref(data.website) : null;
  const sectorLine = sectorLeadLine(data);

  return (
    <div className="public-profile-brand-hero-wrap">
      <header className="public-profile-hero public-profile-hero--brand public-profile-hero--brand-rich public-profile-hero--premium">
        <div className="public-profile-brand-cover" aria-hidden />
        <div className="public-profile-brand-hero-inner">
          <div className="public-profile-hero__identity public-profile-hero__identity--brand">
            <div className="public-profile-hero__avatar-wrap">
              <div className="public-profile-hero__avatar-ring public-profile-hero__avatar-ring--brand">
                <img className="public-profile-hero__avatar" src={avatarSrc} alt="" width={168} height={168} />
              </div>
            </div>
            <div className="public-profile-hero__identity-text">
              <div className="public-profile-hero__title-row">
                <h1 className="public-profile-hero__name">{data.name}</h1>
                <span className="public-profile-role-badge public-profile-role-badge--brand">Marka</span>
              </div>
              <p className="public-profile-hero__handle muted">@{data.username}</p>

              {data.contactName?.trim() && data.contactName.trim() !== data.name.trim() ? (
                <p className="public-profile-hero__contact muted">{data.contactName.trim()}</p>
              ) : null}

              {sectorLine ? (
                <p className="public-profile-hero__category-lead muted">{sectorLine}</p>
              ) : null}

              <div className="public-profile-hero__meta public-profile-hero__meta--brand-row public-profile-hero__meta--hero-tight">
                {data.city?.trim() ? (
                  <p className="public-profile-hero__meta-line muted public-profile-hero__meta-line--icon">
                    <span
                      className="public-profile-hero__meta-icon public-profile-hero__meta-icon--svg"
                      aria-hidden
                    >
                      <PublicProfileIconMapPin className="public-profile-icon public-profile-icon--meta" />
                    </span>
                    {data.city.trim()}
                  </p>
                ) : null}
                {webHref ? (
                  <p className="public-profile-hero__meta-line public-profile-hero__meta-line--web public-profile-hero__meta-line--icon">
                    <span
                      className="public-profile-hero__meta-icon public-profile-hero__meta-icon--svg"
                      aria-hidden
                    >
                      <PublicProfileIconArrowTopRightOnSquare className="public-profile-icon public-profile-icon--meta" />
                    </span>
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
                  <p className="public-profile-hero__meta-line public-profile-hero__meta-line--trust muted public-profile-hero__meta-line--icon">
                    <span className="public-profile-hero__trust-icon" aria-hidden>
                      <PublicProfileIconShieldCheck className="public-profile-icon public-profile-icon--meta" />
                    </span>
                    {socialVerifiedCount} doğrulanmış sosyal hesap
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="public-profile-hero__cta-region public-profile-hero__cta-region--brand-full public-profile-hero__cta-region--premium">
          {cta != null ? (
            <div className="public-profile-hero__cta public-profile-hero__cta--brand-panel">{cta}</div>
          ) : null}
          {isOwnPublicProfile ? null : viewerRole === "INFLUENCER" ? (
            <PublicInfluencerBrandOfferCta
              brandUserId={data.id}
              chatHref={chatHref}
              averageRating={data.averageRating}
              ratingCount={data.ratingCount}
              completedCollaborationsCount={data.completedCollaborationsCount}
            />
          ) : viewerRole === "BRAND" ? (
            <p className="public-profile-hero__cta-hint public-profile-hero__cta-hint--solo">
              Bu sayfa influencer teklifleri içindir; marka hesabınızla influencer profillerine teklif
              gönderebilirsiniz.
            </p>
          ) : (
            <div className="public-profile-hero__cta-row public-profile-hero__cta-row--solo">
              <Link href="/giris" className="btn public-profile-hero__cta-btn">
                Influencer olarak giriş yap
              </Link>
              <p className="public-profile-hero__cta-hint">
                Markaya iş birliği teklifi göndermek için influencer hesabınızla giriş yapın.
              </p>
            </div>
          )}
        </div>
      </header>
    </div>
  );
}
