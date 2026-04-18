/**
 * Lowercase + Turkish-aware folding for search comparison.
 * Does not replace Prisma `mode: insensitive` — used for in-memory scoring.
 */
export function normalizeSearchText(s: string): string {
  return s
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/\s+/g, " ");
}

/** Remove spaces for “zeynepbastık” vs “zeynep bastık” style matching. */
export function compactSearchText(s: string): string {
  return normalizeSearchText(s).replace(/\s+/g, "");
}

/**
 * ASCII-ish fold after Turkish lowercasing — helps fuzzy distance when query
 * uses Latin keyboard (bastik vs bastık) without changing DB matching.
 */
export function foldTrAscii(s: string): string {
  return normalizeSearchText(s)
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

export function compactFoldedSearchText(s: string): string {
  return foldTrAscii(s).replace(/\s+/g, "");
}

/** Meaningful tokens (min length configurable). */
export function tokenizeSearchQuery(raw: string, minLen = 2): string[] {
  const n = normalizeSearchText(raw);
  if (!n) return [];
  const parts = n.split(/[\s,.;:/\\|]+/).filter((t) => t.length >= minLen);
  return [...new Set(parts)];
}
