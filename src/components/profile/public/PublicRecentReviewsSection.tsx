import type { PublicProfileRecentReviewJson } from "@/lib/publicProfile/influencerPublicReviews";
import { RatingStarsReadonly } from "@/components/offers/RatingStarsReadonly";

function formatReviewDateIso(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return iso.slice(0, 10);
  }
}

/** API’deki kısa rol etiketini “… tarafından” cümlesine çevirir. */
function reviewerAttribution(label: string): string {
  const t = label.trim();
  if (t === "Marka") return "Marka tarafından";
  if (t === "Influencer") return "Influencer tarafından";
  if (t === "Yönetici") return "Yönetici tarafından";
  return `${t} tarafından`;
}

type Props = {
  reviews: PublicProfileRecentReviewJson[];
};

/**
 * Review (metin + yıldız) satırları — hero’daki CollaborationRating ortalamasından ayrı.
 */
export function PublicRecentReviewsSection({ reviews }: Props) {
  return (
    <section
      className="public-profile-recent-reviews"
      aria-labelledby="public-recent-reviews-heading"
    >
      <h2 id="public-recent-reviews-heading" className="public-profile-recent-reviews__title">
        Son değerlendirmeler
      </h2>

      {reviews.length === 0 ? (
        <p className="public-profile-recent-reviews__empty muted">
          Henüz public değerlendirme yok
        </p>
      ) : (
        <ul className="public-profile-recent-reviews__list">
          {reviews.map((item, index) => {
            const comment = item.comment?.trim() ?? "";
            const hasComment = comment.length > 0;
            return (
              <li
                key={`${item.createdAt}-${index}`}
                className="public-profile-recent-reviews__card"
              >
                <div className="public-profile-recent-reviews__card-top">
                  <RatingStarsReadonly
                    rating={item.rating}
                    size="sm"
                    label={`${item.rating} üzerinden 5 yıldız`}
                  />
                  <time
                    className="public-profile-recent-reviews__date muted"
                    dateTime={item.createdAt}
                  >
                    {formatReviewDateIso(item.createdAt)}
                  </time>
                </div>
                <p className="public-profile-recent-reviews__attribution muted">
                  {reviewerAttribution(item.reviewerTypeLabel)}
                </p>
                {hasComment ? (
                  <p className="public-profile-recent-reviews__comment">{comment}</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
