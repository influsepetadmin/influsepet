"use client";

/** Tıklanabilir 1–5 yıldız seçimi (amber). */
export function RatingStarsInput({
  value,
  onChange,
  disabled,
  idPrefix = "rating-star",
}: {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  return (
    <div className="collab-rating-input" role="group" aria-label="Puan seçin (1–5)">
      {[1, 2, 3, 4, 5].map((n) => {
        const active = value != null && n <= value;
        return (
          <button
            key={n}
            type="button"
            id={`${idPrefix}-${n}`}
            className={`collab-rating-input__star ${active ? "collab-rating-input__star--on" : ""}`}
            disabled={disabled}
            aria-pressed={active}
            aria-label={`${n} yıldız`}
            onClick={() => onChange(n)}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
