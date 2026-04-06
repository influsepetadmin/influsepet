/**
 * Full stars only (no half). Filled count = rounded average clamped 1–5 when showing from average.
 */
export function RatingStars({
  value,
  size = "sm",
  className,
}: {
  value: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const rounded = Math.min(5, Math.max(0, Math.round(value)));
  const sizeClass =
    size === "md" ? "rating-stars--md" : size === "lg" ? "rating-stars--lg" : "";
  return (
    <span className={`rating-stars ${sizeClass} ${className ?? ""}`.trim()} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < rounded ? "rating-stars__fill" : "rating-stars__empty"}>
          ★
        </span>
      ))}
    </span>
  );
}
