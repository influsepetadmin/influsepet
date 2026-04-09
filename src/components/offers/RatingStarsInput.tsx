"use client";

import { useId } from "react";

/**
 * 1–5 yıldız seçimi (CollaborationRating; isteğe bağlı kısa not ayrı alanda).
 * Aynı isimli radyolar: klavye okları ve ekran okuyucu uyumu.
 */
export function RatingStarsInput({
  value,
  onChange,
  disabled,
  idPrefix = "collab-rating",
}: {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
  idPrefix?: string;
}) {
  const uid = useId();
  const name = `${idPrefix}-stars-${uid}`;

  return (
    <fieldset className="collab-rating-fieldset" disabled={disabled}>
      <legend className="collab-rating-sr-only">
        Karşı tarafa vereceğiniz iş birliği puanını seçin (1 ile 5 yıldız arası)
      </legend>
      <div className="collab-rating-input collab-rating-input--radios">
        {[1, 2, 3, 4, 5].map((n) => {
          const id = `${idPrefix}-${n}-${uid}`;
          const filled = value != null && n <= value;
          return (
            <label
              key={n}
              htmlFor={id}
              className={`collab-rating-input__option ${filled ? "collab-rating-input__option--fill" : ""}`}
            >
              <input
                id={id}
                type="radio"
                name={name}
                value={String(n)}
                checked={value === n}
                onChange={() => onChange(n)}
                className="collab-rating-input__radio"
              />
              <span className="collab-rating-input__face" aria-hidden>
                ★
              </span>
              <span className="collab-rating-sr-only">{n} yıldız</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
