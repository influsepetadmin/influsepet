"use client";

/** Küçük, salt okunur 1–5 yıldız (amber). */
export function RatingStarsReadonly({
  rating,
  size = "md",
  label,
}: {
  rating: number;
  size?: "sm" | "md";
  /** Erişilebilirlik için kısa metin */
  label?: string;
}) {
  const r = Math.min(5, Math.max(1, Math.round(rating)));
  const className =
    size === "sm" ? "collab-rating-stars collab-rating-stars--sm" : "collab-rating-stars";

  return (
    <span className={className} role="img" aria-label={label ?? `${r} üzerinden 5 yıldız`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < r ? "collab-rating-stars__on" : "collab-rating-stars__off"}>
          ★
        </span>
      ))}
    </span>
  );
}
