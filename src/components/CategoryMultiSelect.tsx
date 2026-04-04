"use client";

import { useMemo, useState } from "react";
import { CATEGORY_KEYS, getCategoryLabel } from "@/lib/categories";

export default function CategoryMultiSelect({
  initialSelected,
  inputName = "categoryKeys",
}: {
  initialSelected: string[];
  inputName?: string;
}) {
  const initial = useMemo(() => initialSelected.filter(Boolean).slice(0, 3), [initialSelected]);
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const has = prev.includes(key);
      if (has) return prev.filter((x) => x !== key);
      if (prev.length >= 3) return prev;
      return [...prev, key];
    });
  };

  return (
    <div className="category-multi-select">
      <div className="category-multi-select__grid" role="group" aria-label="Kategori seçimi">
        {CATEGORY_KEYS.map((key) => {
          const checked = selected.includes(key);
          return (
            <label
              key={key}
              className={
                "category-multi-select__item" +
                (checked ? " category-multi-select__item--selected" : "")
              }
            >
              <input
                type="checkbox"
                className="category-multi-select__input"
                name={inputName}
                value={key}
                checked={checked}
                onChange={() => toggle(key)}
              />
              <span className="category-multi-select__text">{getCategoryLabel(key)}</span>
            </label>
          );
        })}
      </div>
      <p className="category-multi-select__hint muted">En fazla 3 kategori secili olabilir.</p>
    </div>
  );
}
