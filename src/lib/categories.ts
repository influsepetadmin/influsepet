/**
 * Sabit kategori anahtarları (max 20) — arama / filtre ana yapısı.
 * Eski kayıtlardaki anahtarlar için getCategoryLabel + LEGACY_LABELS kullanılır.
 */

const CATEGORY_DEFINITIONS = [
  { key: "moda", label: "Moda" },
  { key: "guzellik", label: "Güzellik" },
  { key: "teknoloji", label: "Teknoloji" },
  { key: "yemek", label: "Yemek" },
  { key: "seyahat", label: "Seyahat" },
  { key: "spor_fitness", label: "Spor & Fitness" },
  { key: "oyun", label: "Oyun" },
  { key: "muzik", label: "Müzik" },
  { key: "anne_bebek_aile", label: "Anne / Bebek / Aile" },
  { key: "finans", label: "Finans" },
  { key: "egitim", label: "Eğitim" },
  { key: "yasam_tarzi", label: "Yaşam Tarzı" },
  { key: "ev_dekorasyon", label: "Ev & Dekorasyon" },
  { key: "otomotiv", label: "Otomotiv" },
  { key: "saglik_wellness", label: "Sağlık & Wellness" },
  { key: "mizah_eglence", label: "Mizah / Eğlence" },
  { key: "kitap_kultur_sanat", label: "Kitap / Kültür / Sanat" },
  { key: "evcil_hayvan", label: "Evcil Hayvan" },
  { key: "is_girisimcilik", label: "İş / Girişimcilik" },
  { key: "yerel_kesif_mekan", label: "Yerel Keşif / Mekân" },
] as const;

const LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_DEFINITIONS.map((c) => [c.key, c.label]),
);

/** v1 listeden kalan satırlar — DB’de hâlâ görünebilir. */
const LEGACY_LABELS: Record<string, string> = {
  spor: "Spor & Fitness",
  aile: "Anne / Bebek / Aile",
  diger: "Diğer",
};

/**
 * Eski anahtar → güncel checkbox anahtarı (ilk kayıtta tek yönlü).
 * spor / aile gibi birleşen isimler için.
 */
export const LEGACY_KEY_TO_CURRENT: Record<string, string> = {
  spor: "spor_fitness",
  aile: "anne_bebek_aile",
};

export const CATEGORY_KEYS: string[] = CATEGORY_DEFINITIONS.map((c) => c.key);

export function getCategoryLabel(key: string) {
  return LABELS[key] ?? LEGACY_LABELS[key] ?? key;
}

/**
 * Form checkbox’ları için: yalnızca güncel CATEGORY_KEYS içindekiler.
 * Eski `spor` → `spor_fitness` vb. eşlenir; eşlenemeyen (ör. sadece `diger`) çıkarılır.
 */
export function normalizeCategoryKeysForForm(storedKeys: string[], primaryFallback?: string | null): string[] {
  const raw = storedKeys.length > 0 ? storedKeys : primaryFallback ? [primaryFallback] : [];
  const out: string[] = [];
  for (const k of raw) {
    const mapped = LEGACY_KEY_TO_CURRENT[k] ?? k;
    if (CATEGORY_KEYS.includes(mapped)) out.push(mapped);
  }
  return [...new Set(out)].slice(0, 3);
}

/**
 * Category keys whose label or key partially matches the search (case-insensitive, spacing-tolerant).
 * Used for Prisma `categoryKey: { in: [...] }` — no DB extension required.
 */
export function matchCategoryKeysForSearch(raw: string): string[] {
  const primary = raw.trim().toLocaleLowerCase("tr-TR");
  if (!primary) return [];
  const compact = primary.replace(/\s+/g, "");
  const keys = new Set<string>();

  for (const def of CATEGORY_DEFINITIONS) {
    const label = def.label.toLocaleLowerCase("tr-TR");
    const key = def.key.toLowerCase();
    const labelCompact = label.replace(/\s+/g, "");
    if (
      label.includes(primary) ||
      primary.includes(label) ||
      key.includes(primary) ||
      primary.includes(key) ||
      labelCompact.includes(compact) ||
      compact.includes(labelCompact)
    ) {
      keys.add(def.key);
    }
  }

  for (const legacy of Object.keys(LEGACY_LABELS)) {
    const lk = legacy.toLowerCase();
    const legacyLabel = (LEGACY_LABELS[legacy] ?? "").toLocaleLowerCase("tr-TR");
    const legacyLabelCompact = legacyLabel.replace(/\s+/g, "");
    if (
      lk.includes(primary) ||
      primary.includes(lk) ||
      legacyLabel.includes(primary) ||
      primary.includes(legacyLabel) ||
      legacyLabelCompact.includes(compact) ||
      compact.includes(legacyLabelCompact)
    ) {
      keys.add(LEGACY_KEY_TO_CURRENT[legacy] ?? legacy);
    }
  }

  return [...keys];
}
