"use client";

import Link from "next/link";
import { getCategoryLabel } from "@/lib/categories";
import { getProfileCtaAbVariantForTrack } from "@/lib/productTracking/profileCtaAb";
import { trackProductEvent } from "@/lib/productTracking/productEvents";

function buildHref(
  basePath: string,
  state: { q: string; city: string; categories: string[] },
  remove: { kind: "q" } | { kind: "city" } | { kind: "category"; key: string },
): string {
  let q = state.q.trim();
  let city = state.city.trim();
  let categories = [...state.categories];
  if (remove.kind === "q") q = "";
  if (remove.kind === "city") city = "";
  if (remove.kind === "category") categories = categories.filter((k) => k !== remove.key);

  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (city) p.set("city", city);
  for (const c of categories) p.append("categories", c);
  const qs = p.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function DiscoverActiveFilters({
  basePath,
  q,
  city,
  categoryKeys,
}: {
  basePath: string;
  q: string;
  city: string;
  categoryKeys: string[];
}) {
  const state = { q, city, categories: categoryKeys };
  const chips: { key: string; label: string; href: string; aria: string; trackLabel: string }[] = [];

  if (q.trim()) {
    chips.push({
      key: "q",
      label: `“${q.trim().slice(0, 48)}${q.trim().length > 48 ? "…" : ""}”`,
      href: buildHref(basePath, state, { kind: "q" }),
      aria: "Arama metnini kaldır",
      trackLabel: "remove_query",
    });
  }
  if (city.trim()) {
    chips.push({
      key: "city",
      label: `Şehir: ${city.trim()}`,
      href: buildHref(basePath, state, { kind: "city" }),
      aria: "Şehir filtresini kaldır",
      trackLabel: "remove_city",
    });
  }
  for (const key of categoryKeys) {
    chips.push({
      key: `cat-${key}`,
      label: getCategoryLabel(key),
      href: buildHref(basePath, state, { kind: "category", key }),
      aria: "Bu kategoriyi kaldır",
      trackLabel: `remove_category:${key}`,
    });
  }

  if (chips.length === 0) return null;

  const clearAllHref = basePath;
  const location = basePath.includes("marka") ? "marka_discover" : "influencer_discover";

  return (
    <div className="discovery-active-filters" aria-label="Etkin filtreler">
      <span className="discovery-active-filters__label">Filtreler</span>
      <div className="discovery-active-filters__chips">
        {chips.map((c) => (
          <Link
            key={c.key}
            className="discovery-filter-chip"
            href={c.href}
            aria-label={c.aria}
            onClick={() =>
              trackProductEvent({
                event: "discover_filter_click",
                location,
                label: "active_filter_chip",
                action: c.trackLabel,
                variant: getProfileCtaAbVariantForTrack(),
              })
            }
          >
            <span>{c.label}</span>
            <span className="discovery-filter-chip__x" aria-hidden>
              ×
            </span>
          </Link>
        ))}
      </div>
      <Link
        className="discovery-active-filters__clear"
        href={clearAllHref}
        onClick={() =>
          trackProductEvent({
            event: "discover_filter_click",
            location,
            label: "clear_all_filters",
            variant: getProfileCtaAbVariantForTrack(),
          })
        }
      >
        Tümünü temizle
      </Link>
    </div>
  );
}
