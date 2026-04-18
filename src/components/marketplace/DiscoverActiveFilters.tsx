import Link from "next/link";
import { getCategoryLabel } from "@/lib/categories";

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
  const chips: { key: string; label: string; href: string; aria: string }[] = [];

  if (q.trim()) {
    chips.push({
      key: "q",
      label: `“${q.trim().slice(0, 48)}${q.trim().length > 48 ? "…" : ""}”`,
      href: buildHref(basePath, state, { kind: "q" }),
      aria: "Arama metnini kaldır",
    });
  }
  if (city.trim()) {
    chips.push({
      key: "city",
      label: `Şehir: ${city.trim()}`,
      href: buildHref(basePath, state, { kind: "city" }),
      aria: "Şehir filtresini kaldır",
    });
  }
  for (const key of categoryKeys) {
    chips.push({
      key: `cat-${key}`,
      label: getCategoryLabel(key),
      href: buildHref(basePath, state, { kind: "category", key }),
      aria: "Bu kategoriyi kaldır",
    });
  }

  if (chips.length === 0) return null;

  const clearAllHref = basePath;

  return (
    <div className="discovery-active-filters" aria-label="Etkin filtreler">
      <span className="discovery-active-filters__label">Filtreler</span>
      <div className="discovery-active-filters__chips">
        {chips.map((c) => (
          <Link key={c.key} className="discovery-filter-chip" href={c.href} aria-label={c.aria}>
            <span>{c.label}</span>
            <span className="discovery-filter-chip__x" aria-hidden>
              ×
            </span>
          </Link>
        ))}
      </div>
      <Link className="discovery-active-filters__clear" href={clearAllHref}>
        Tümünü temizle
      </Link>
    </div>
  );
}
