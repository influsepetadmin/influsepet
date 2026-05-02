import type { ReactNode } from "react";
import Link from "next/link";
import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { getAvatarUrl } from "@/lib/avatar";
import { FirstVisitGuidanceGate } from "@/components/onboarding/FirstVisitGuidanceGate";
import { PublicCollaborationRequestCta } from "./PublicCollaborationRequestCta";
import {
  PublicProfileIconMapPin,
  PublicProfileIconShieldCheck,
} from "./publicProfileInfluencerIcons";
import { PublicProfileOwnerPreviewNote } from "./PublicProfileOwnerPreviewNote";

function categoryLeadLine(data: PublicProfileByUsernameResponse): string | null {
  const labels = data.categories.slice(0, 4).map((c) => c.label);
  const niche = data.nicheText?.trim();
  if (labels.length === 0 && !niche) return null;
  if (labels.length >= 2) return labels.slice(0, 3).join(" · ");
  if (labels.length === 1) return niche ? `${labels[0]} · ${niche}` : labels[0];
  return niche ?? null;
}

export function PublicProfileHeader({
  data,
  cta,
  isOwnPublicProfile,
  chatHref,
  canSendCollaborationRequest = true,
  cameFromDiscover = false,
}: {
  data: PublicProfileByUsernameResponse;
  /** Marka paneli: herkese açık link vb. (isteğe bağlı; iş birliği CTA’sından ayrı). */
  cta?: ReactNode;
  /** Oturumdaki influencer bu herkese açık profili mi görüyor. */
  isOwnPublicProfile: boolean;
  /** Marka + influencer çifti için mevcut sohbet. */
  chatHref?: string | null;
  /** Oturumdaki marka bu influencer’a istek gönderebilir mi (giriş + rol). */
  canSendCollaborationRequest?: boolean;
  cameFromDiscover?: boolean;
}) {
  const avatarSrc = data.avatarUrl?.trim() || getAvatarUrl(data.id);
  const socialVerifiedCount = data.verifiedSocialAccounts.length;
  const categoryLine = categoryLeadLine(data);

  return (
    <header className="public-profile-hero public-profile-hero--influencer public-profile-hero--premium">
      <div className="public-profile-hero__identity">
        <div className="public-profile-hero__avatar-wrap">
          <div className="public-profile-hero__avatar-ring">
            <img className="public-profile-hero__avatar" src={avatarSrc} alt="" width={168} height={168} />
          </div>
        </div>
        <div className="public-profile-hero__identity-text">
          <div className="public-profile-hero__title-row">
            <h1 className="public-profile-hero__name">{data.name}</h1>
            <span className="public-profile-role-badge">Influencer</span>
          </div>
          <p className="public-profile-hero__handle muted">@{data.username}</p>
          {categoryLine ? (
            <p className="public-profile-hero__category-lead muted">{categoryLine}</p>
          ) : null}

          <div className="public-profile-hero__meta public-profile-hero__meta--hero-tight">
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

      <div className="public-profile-hero__cta-region public-profile-hero__cta-region--premium">
        {cta != null ? <div className="public-profile-hero__cta public-profile-hero__cta--brand-panel">{cta}</div> : null}
        {isOwnPublicProfile ? (
          <PublicProfileOwnerPreviewNote />
        ) : canSendCollaborationRequest ? (
          <PublicCollaborationRequestCta
            influencerUserId={data.id}
            defaultBudgetTRY={data.basePriceTRY}
            chatHref={chatHref}
            averageRating={data.averageRating}
            ratingCount={data.ratingCount}
            completedCollaborationsCount={data.completedCollaborationsCount}
            cameFromDiscover={cameFromDiscover}
          />
        ) : (
          <div className="public-profile-hero__cta-row public-profile-hero__cta-row--solo">
            <Link href="/giris" className="btn public-profile-hero__cta-btn">
              Marka olarak giriş yap
            </Link>
            <p className="public-profile-hero__cta-hint">
              İş birliği teklifi göndermek için marka hesabınızla giriş yapın.
            </p>
          </div>
        )}
        {!isOwnPublicProfile ? <FirstVisitGuidanceGate scope="profile" /> : null}
      </div>
    </header>
  );
}
