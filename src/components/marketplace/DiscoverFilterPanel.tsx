"use client";

import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import CitySelect from "@/components/CitySelect";
import { TrackedDiscoverSubmitButton } from "@/components/marketplace/TrackedDiscoverSubmitButton";

export function DiscoverFilterPanel({
  basePath,
  cityInputId,
  categoryLabelId,
  city,
  q,
  selectedCategoryKeys,
  submitLocation,
  defaultOpen = false,
}: {
  basePath: string;
  cityInputId: string;
  categoryLabelId: string;
  city: string;
  q: string;
  selectedCategoryKeys: string[];
  submitLocation: "marka_discover" | "influencer_discover";
  defaultOpen?: boolean;
}) {
  const router = useRouter();
  const qValue = q.trim();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const url = new URL(form.getAttribute("action") || basePath, window.location.origin);
    const params = new URLSearchParams();

    for (const [key, value] of new FormData(form).entries()) {
      const text = typeof value === "string" ? value.trim() : "";
      if (!key || !text) continue;
      params.append(key, text);
    }

    const target = `${url.pathname}${params.toString() ? `?${params.toString()}` : ""}`;
    router.push(target, { scroll: false });
  };

  return (
    <details className="dash-card dash-card--section dash-card--emphasis discovery-filter-panel" open={defaultOpen}>
      <summary className="discovery-filter-panel__summary">
        <span className="discovery-filter-panel__summary-copy">
          <span className="discovery-filter-panel__title">Daralt / Filtrele</span>
          <span className="discovery-filter-panel__hint">Gerekirse şehir ve kategori ile daraltın.</span>
        </span>
        <span className="discovery-filter-panel__chevron" aria-hidden>
          ↓
        </span>
      </summary>

      <form
        className="influencer-search-form discovery-search-form discovery-filter-form"
        method="get"
        action={basePath}
        onSubmit={onSubmit}
      >
        {qValue ? <input type="hidden" name="q" value={qValue} /> : null}

        <div className="discovery-search-field">
          <label className="discovery-search-field__label" htmlFor={cityInputId}>
            Şehir
          </label>
          <div className="influencer-search-form__city discovery-search-field__control--city">
            <CitySelect
              id={cityInputId}
              name="city"
              defaultValue={city}
              required={false}
              searchable
            />
          </div>
        </div>

        <div className="discovery-search-field discovery-search-field--categories">
          <span className="discovery-search-field__label" id={categoryLabelId}>
            Kategori
          </span>
          <div className="discovery-search-field__control" aria-labelledby={categoryLabelId}>
            <CategoryMultiSelect
              filterable
              initialSelected={selectedCategoryKeys}
              inputName="categories"
            />
          </div>
        </div>

        <div className="influencer-search-form__actions discovery-search-actions">
          <TrackedDiscoverSubmitButton location={submitLocation}>Filtreleri uygula</TrackedDiscoverSubmitButton>
          <a className="btn secondary discovery-search-actions__reset" href={basePath}>
            Sıfırla
          </a>
        </div>
      </form>
    </details>
  );
}
