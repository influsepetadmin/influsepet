import type { ReactNode } from "react";
import { PublicProfileIconListBullet, PublicProfileIconStar } from "./publicProfileInfluencerIcons";
import { RatingStars } from "./RatingStars";

function ratingCountLabel(count: number): string {
  if (count === 1) return "1 puanlama";
  return `${count.toLocaleString("tr-TR")} puanlama`;
}

export type PublicProfileRatingSummaryProps = {
  averageRating: number | null;
  ratingCount: number;
  /** İleride alt bölüm (ör. yorumlar) için genişletmeye uygun slot — şimdilik kullanılmıyor */
  children?: ReactNode;
};

/**
 * Influencer ve marka hero’da ortak puan kartı.
 * Ortalama CollaborationRating tabanlıdır; yorum listesi ayrı eklenecek.
 */
export function PublicProfileRatingSummary({
  averageRating,
  ratingCount,
  children,
}: PublicProfileRatingSummaryProps) {
  const hasRating = averageRating != null && ratingCount > 0;

  return (
    <section
      className={`public-profile-rating-card ${hasRating ? "public-profile-rating-card--has" : "public-profile-rating-card--empty"}`}
      aria-label="Puan özeti"
    >
      <div className="public-profile-rating-card__inner">
        {hasRating ? (
          <div className="public-profile-rating-card__body public-profile-rating-card__body--filled">
            <p className="public-profile-rating-card__eyebrow">
              <PublicProfileIconStar className="public-profile-icon public-profile-icon--rating-eyebrow" />
              Ortalama puan
            </p>
            <div className="public-profile-rating-card__main-row">
              <span className="public-profile-rating-card__score">{averageRating!.toFixed(1)}</span>
              <div className="public-profile-rating-card__stars-wrap">
                <RatingStars value={averageRating!} size="lg" />
                <p className="public-profile-rating-card__count">
                  <PublicProfileIconListBullet className="public-profile-icon public-profile-icon--rating-count" />
                  {ratingCountLabel(ratingCount)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="public-profile-rating-card__body public-profile-rating-card__body--empty">
            <RatingStars value={0} size="lg" className="public-profile-rating-card__stars--muted" />
            <p className="public-profile-rating-card__empty-msg">Henüz puanlama yok</p>
          </div>
        )}
        {children != null ? <div className="public-profile-rating-card__slot">{children}</div> : null}
      </div>
    </section>
  );
}
