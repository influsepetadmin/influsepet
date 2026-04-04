import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import {
  PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT,
  formatAverageRating,
  formatPublicReviewDate,
  type PublicInfluencerReviewCard,
  type PublicInfluencerReviewsSectionData,
} from "@/lib/publicProfile/influencerPublicReviews";

function reviewCountLabel(count: number): string {
  if (count === 1) return "1 değerlendirme";
  return `${count} değerlendirme`;
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.min(5, Math.max(0, Math.round(rating)));
  return (
    <span
      role="img"
      aria-label={`${rating} / 5 yıldız`}
      className="star-rating-row"
    >
      {"★".repeat(full)}
      <span style={{ color: "var(--border)" }} aria-hidden>
        {"★".repeat(5 - full)}
      </span>
    </span>
  );
}

function ReviewCard({ item }: { item: PublicInfluencerReviewCard }) {
  const dateText = formatPublicReviewDate(item.createdAt);
  return (
    <article className="card card--nested review-card">
      <div className="review-card__head">
        <div className="review-card__meta">
          <StarRow rating={item.rating} />
          <span className="review-card__rating-num">{item.rating}/5</span>
          <span className="review-card__pill">{item.reviewerTypeLabel}</span>
        </div>
        <time className="muted" dateTime={item.createdAt.toISOString()} style={{ fontSize: "0.9rem" }}>
          {dateText}
        </time>
      </div>
      {item.comment ? (
        <p className="review-card__comment">{item.comment}</p>
      ) : (
        <p className="muted" style={{ margin: 0, fontSize: "var(--text-muted)" }}>
          Yorum eklenmemiş.
        </p>
      )}
    </article>
  );
}

export function InfluencerPublicReviewsSection({
  data,
}: {
  data: PublicInfluencerReviewsSectionData;
}) {
  const { totalCount, averageRating, recentReviews } = data;

  if (totalCount === 0) {
    return (
      <section className="card" style={{ marginTop: 16 }} aria-labelledby="reviews-heading">
        <h3 id="reviews-heading" style={{ marginTop: 0 }}>
          Değerlendirmeler
        </h3>
        <EmptyStateCard
          title="Herkese açık değerlendirme yok"
          description="Tamamlanan iş birlikleri sonrası bırakılan yorumlar burada görünecek."
        />
      </section>
    );
  }

  const avgText =
    averageRating != null ? formatAverageRating(averageRating) : "—";

  return (
    <section className="card" style={{ marginTop: 16 }} aria-labelledby="reviews-heading">
      <h3 id="reviews-heading" style={{ marginTop: 0 }}>
        Değerlendirmeler
      </h3>

      <div className="reviews-summary">
        <p style={{ margin: 0 }}>
          <strong>Ortalama:</strong> {avgText} / 5
        </p>
        <p className="muted" style={{ margin: 0 }}>
          {reviewCountLabel(totalCount)}
        </p>
      </div>

      {totalCount > PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT ? (
        <p className="muted" style={{ fontSize: "0.9rem", marginTop: 0, marginBottom: 12 }}>
          Toplam {totalCount} değerlendirme; aşağıda son {recentReviews.length} kayıt listeleniyor.
        </p>
      ) : null}

      <div>
        {recentReviews.map((item, index) => (
          <ReviewCard key={`review-${index}`} item={item} />
        ))}
      </div>
    </section>
  );
}
