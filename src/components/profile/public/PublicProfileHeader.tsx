import type { ReactNode } from "react";
import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { getAvatarUrl } from "@/lib/avatar";
import { CategoryBadgeGroup } from "./CategoryBadgeGroup";
import { PublicCollaborationRequestCta } from "./PublicCollaborationRequestCta";
import {
  PublicProfileIconMapPin,
  PublicProfileIconShieldCheck,
} from "./publicProfileInfluencerIcons";
import { PublicProfileOwnerPreviewNote } from "./PublicProfileOwnerPreviewNote";
import { PublicProfileRatingSummary } from "./PublicProfileRatingSummary";
import { PublicRecentReviewsSection } from "./PublicRecentReviewsSection";

export function PublicProfileHeader({
  data,
  cta,
  isOwnPublicProfile,
}: {
  data: PublicProfileByUsernameResponse;
  /** Marka paneli: herkese açık link vb. (isteğe bağlı; iş birliği CTA’sından ayrı). */
  cta?: ReactNode;
  /** Oturumdaki influencer bu herkese açık profili mi görüyor. */
  isOwnPublicProfile: boolean;
}) {
  const avatarSrc = data.avatarUrl?.trim() || getAvatarUrl(data.id);
  const socialVerifiedCount = data.verifiedSocialAccounts.length;

  return (
    <header className="public-profile-hero public-profile-hero--influencer">
      <div className="public-profile-hero__avatar-wrap">
        <div className="public-profile-hero__avatar-ring">
          <img className="public-profile-hero__avatar" src={avatarSrc} alt="" width={144} height={144} />
        </div>
      </div>
      <div className="public-profile-hero__main">
        <div className="public-profile-hero__title-row">
          <h1 className="public-profile-hero__name">{data.name}</h1>
          <span className="public-profile-role-badge">Influencer</span>
        </div>
        <p className="public-profile-hero__handle muted">@{data.username}</p>

        <div className="public-profile-hero__meta">
          {data.city?.trim() ? (
            <p className="public-profile-hero__meta-line muted public-profile-hero__meta-line--icon">
              <span className="public-profile-hero__meta-icon public-profile-hero__meta-icon--svg" aria-hidden>
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

        <PublicProfileRatingSummary
          averageRating={data.averageRating}
          ratingCount={data.ratingCount}
        />

        <PublicRecentReviewsSection reviews={data.recentPublicReviews} />

        <CategoryBadgeGroup bare categories={data.categories} nicheText={data.nicheText} />

        {data.bio?.trim() ? (
          <p className="public-profile-hero__bio public-profile-hero__bio--prose">{data.bio.trim()}</p>
        ) : (
          <p className="public-profile-hero__bio-placeholder muted">
            Henüz kısa bir biyografi eklenmemiş.
          </p>
        )}

        <div className="public-profile-hero__cta-region">
          {cta != null ? (
            <div className="public-profile-hero__cta public-profile-hero__cta--brand-panel">{cta}</div>
          ) : null}
          {isOwnPublicProfile ? (
            <PublicProfileOwnerPreviewNote />
          ) : (
            <PublicCollaborationRequestCta
              influencerUserId={data.id}
              defaultBudgetTRY={data.basePriceTRY}
            />
          )}
        </div>
      </div>
    </header>
  );
}
