import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { getAvatarUrl } from "@/lib/avatar";
import { CategoryBadgeGroup } from "./CategoryBadgeGroup";
import { PublicProfileRatingSummary } from "./PublicProfileRatingSummary";
import { PublicRecentReviewsSection } from "./PublicRecentReviewsSection";

export function PublicProfileHeader({ data }: { data: PublicProfileByUsernameResponse }) {
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
            <p className="public-profile-hero__meta-line muted">
              <span className="public-profile-hero__meta-icon" aria-hidden>
                ◎
              </span>
              {data.city.trim()}
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

        <PublicProfileRatingSummary
          averageRating={data.averageRating}
          ratingCount={data.ratingCount}
        />

        <PublicRecentReviewsSection reviews={data.recentPublicReviews} />

        <CategoryBadgeGroup bare categories={data.categories} nicheText={data.nicheText} />

        {data.bio?.trim() ? (
          <p className="public-profile-hero__bio public-profile-hero__bio--prose">{data.bio.trim()}</p>
        ) : null}

        <div className="public-profile-hero__cta">
          <button type="button" className="btn public-profile-hero__cta-btn" disabled>
            İş birliği isteği gönder
          </button>
          <p className="public-profile-hero__cta-hint">Bu özellik yakında etkinleşecek.</p>
        </div>
      </div>
    </header>
  );
}
