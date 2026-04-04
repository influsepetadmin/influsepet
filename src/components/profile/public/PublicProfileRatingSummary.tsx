import { RatingStars } from "./RatingStars";

/** Influencer ve marka hero’da ortak puan satırı. */
export function PublicProfileRatingSummary({
  ratingAverage,
  ratingCount,
}: {
  ratingAverage: number | null;
  ratingCount: number;
}) {
  const hasRating = ratingAverage != null && ratingCount > 0;

  return (
    <div
      className={`public-profile-rating-summary ${hasRating ? "public-profile-rating-summary--has" : "public-profile-rating-summary--empty"}`}
      aria-label="Puan özeti"
    >
      {hasRating ? (
        <>
          <span className="public-profile-rating-summary__num">{ratingAverage!.toFixed(1)}</span>
          <RatingStars value={ratingAverage!} size="md" />
          <span className="public-profile-rating-summary__meta">
            {ratingCount.toLocaleString("tr-TR")} puanlama
          </span>
        </>
      ) : (
        <span className="public-profile-rating-summary__empty-label">Henüz puanlama yok</span>
      )}
    </div>
  );
}
