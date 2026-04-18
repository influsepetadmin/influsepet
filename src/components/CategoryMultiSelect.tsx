"use client";

import { useMemo, useState } from "react";
import { CATEGORY_KEYS, getCategoryLabel } from "@/lib/categories";

export default function CategoryMultiSelect({
  initialSelected,
  inputName = "categoryKeys",
  filterable = false,
}: {
  initialSelected: string[];
  inputName?: string;
  /** Keşfet: kategori etiketinde metin araması */
  filterable?: boolean;
}) {
  const initial = useMemo(() => initialSelected.filter(Boolean).slice(0, 3), [initialSelected]);
  const [selected, setSelected] = useState<string[]>(initial);
  const [filter, setFilter] = useState("");

  const visibleKeys = useMemo(() => {
    if (!filterable || !filter.trim()) return CATEGORY_KEYS;
    const f = filter.trim().toLocaleLowerCase("tr-TR");
    return CATEGORY_KEYS.filter((key) =>
      getCategoryLabel(key).toLocaleLowerCase("tr-TR").includes(f),
    );
  }, [filterable, filter]);

  const selectedHiddenFromView = useMemo(
    () => selected.filter((k) => !visibleKeys.includes(k)),
    [selected, visibleKeys],
  );

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
      {filterable ? (
        <input
          type="search"
          className="category-multi-select__filter"
          placeholder="Kategori ara…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label="Kategori listesini filtrele"
          autoComplete="off"
        />
      ) : null}
      {selectedHiddenFromView.map((key) => (
        <input key={`hidden-cat-${key}`} type="hidden" name={inputName} value={key} />
      ))}
      <div className="category-multi-select__grid" role="group" aria-label="Kategori seçimi">
        {visibleKeys.map((key) => {
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
      {filterable && visibleKeys.length === 0 ? (
        <p className="category-multi-select__hint muted">Eşleşen kategori yok.</p>
      ) : (
        <p className="category-multi-select__hint muted">En fazla 3 kategori secili olabilir.</p>
      )}
    </div>
  );
}
