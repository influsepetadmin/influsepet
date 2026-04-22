import type { Prisma } from "@prisma/client";
import { matchCategoryKeysForSearch } from "@/lib/categories";
import { foldTrAscii } from "@/lib/discovery/searchNormalize";

/** Trimmed user input (preserve casing for display; use in Prisma with insensitive mode). */
export function parseMarketplaceSearchQuery(raw: string | undefined | null): string {
  return (raw ?? "").trim();
}

export type SearchTextVariants = { primary: string; secondary: string | null };

/**
 * Non-empty trimmed query plus a whitespace-stripped variant for “zeynep bastık” vs “zeynepbastık”.
 */
export function getSearchTextVariants(raw: string): SearchTextVariants | null {
  const primary = raw.trim();
  if (!primary) return null;
  const compact = primary.replace(/\s+/g, "");
  return { primary, secondary: compact === primary ? null : compact };
}

/** Turkish-normalized whitespace terms for multi-word AND matching. */
export function splitSearchTerms(raw: string): string[] {
  const n = raw.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ");
  return n.split(" ").filter(Boolean);
}

/**
 * Substrings we OR-match in Prisma (insensitive) + ASCII-folded variants for keyboard mismatches.
 */
export function collectSearchContainsVariants(term: string): string[] {
  const t = term.trim();
  if (!t) return [];
  const out = new Set<string>();
  const add = (s: string) => {
    const x = s.trim();
    if (x) out.add(x);
  };
  add(t);
  add(t.replace(/\s+/g, ""));
  const v = getSearchTextVariants(t);
  if (v) {
    add(v.primary);
    if (v.secondary) add(v.secondary);
  }
  const folded = foldTrAscii(t);
  add(folded);
  add(folded.replace(/\s+/g, ""));
  return [...out];
}

function unionCategoryKeysForFragments(fragments: string[]): string[] {
  const keys = new Set<string>();
  for (const f of fragments) {
    for (const k of matchCategoryKeysForSearch(f)) keys.add(k);
  }
  return [...keys];
}

function pushInfluencerFieldContains(
  or: Prisma.InfluencerProfileWhereInput[],
  field: "username" | "nicheText" | "bio" | "category" | "city",
  fragments: string[],
) {
  for (const f of fragments) {
    or.push({ [field]: { contains: f, mode: "insensitive" } });
  }
}

function pushBrandFieldContains(
  or: Prisma.BrandProfileWhereInput[],
  field: "companyName" | "city" | "bio" | "website" | "username",
  fragments: string[],
) {
  for (const f of fragments) {
    or.push({ [field]: { contains: f, mode: "insensitive" } });
  }
}

/** One search term → OR across profile fields + category keys (unified literal layer). */
export function buildSingleTermInfluencerWhere(term: string): Prisma.InfluencerProfileWhereInput | null {
  const fragments = collectSearchContainsVariants(term);
  if (fragments.length === 0) return null;
  const or: Prisma.InfluencerProfileWhereInput[] = [];

  pushInfluencerFieldContains(or, "username", fragments);
  pushInfluencerFieldContains(or, "nicheText", fragments);
  pushInfluencerFieldContains(or, "bio", fragments);
  pushInfluencerFieldContains(or, "category", fragments);
  pushInfluencerFieldContains(or, "city", fragments);

  for (const f of fragments) {
    or.push({ user: { name: { contains: f, mode: "insensitive" } } });
  }

  const catKeys = unionCategoryKeysForFragments(fragments);
  if (catKeys.length > 0) {
    or.push({ selectedCategories: { some: { categoryKey: { in: catKeys } } } });
  }

  return or.length > 0 ? { OR: or } : null;
}

export function buildSingleTermBrandWhere(term: string): Prisma.BrandProfileWhereInput | null {
  const fragments = collectSearchContainsVariants(term);
  if (fragments.length === 0) return null;
  const or: Prisma.BrandProfileWhereInput[] = [];

  pushBrandFieldContains(or, "companyName", fragments);
  pushBrandFieldContains(or, "city", fragments);
  pushBrandFieldContains(or, "bio", fragments);
  pushBrandFieldContains(or, "website", fragments);
  pushBrandFieldContains(or, "username", fragments);

  for (const f of fragments) {
    or.push({ user: { name: { contains: f, mode: "insensitive" } } });
  }

  const catKeys = unionCategoryKeysForFragments(fragments);
  if (catKeys.length > 0) {
    or.push({ selectedCategories: { some: { categoryKey: { in: catKeys } } } });
  }

  return or.length > 0 ? { OR: or } : null;
}

/**
 * Text clause for influencer marketplace:
 * - Single term (no spaces): OR across fields + category keys (broad).
 * - Multiple terms: AND across terms — each term must match somewhere (coherent multi-word search).
 */
export function buildInfluencerProfileTextWhere(rawQuery: string): Prisma.InfluencerProfileWhereInput | null {
  const terms = splitSearchTerms(rawQuery);
  if (terms.length === 0) return null;

  if (terms.length === 1) {
    const v = getSearchTextVariants(rawQuery);
    if (!v) return null;
    const fromFullPhrase = buildSingleTermInfluencerWhere(v.primary);
    if (!v.secondary) return fromFullPhrase;
    const fromCompactOnly = buildSingleTermInfluencerWhere(v.secondary);
    if (!fromFullPhrase) return fromCompactOnly;
    if (!fromCompactOnly) return fromFullPhrase;
    if (JSON.stringify(fromFullPhrase) === JSON.stringify(fromCompactOnly)) return fromFullPhrase;
    return { OR: [fromFullPhrase, fromCompactOnly] };
  }

  const clauses = terms.map((t) => buildSingleTermInfluencerWhere(t)).filter(Boolean) as Prisma.InfluencerProfileWhereInput[];
  if (clauses.length === 0) return null;
  return { AND: clauses };
}

/**
 * Same AND/OR rules as influencer text search.
 */
export function buildBrandProfileTextWhere(rawQuery: string): Prisma.BrandProfileWhereInput | null {
  const terms = splitSearchTerms(rawQuery);
  if (terms.length === 0) return null;

  if (terms.length === 1) {
    const v = getSearchTextVariants(rawQuery);
    if (!v) return null;
    const fromFullPhrase = buildSingleTermBrandWhere(v.primary);
    if (!v.secondary) return fromFullPhrase;
    const fromCompactOnly = buildSingleTermBrandWhere(v.secondary);
    if (!fromFullPhrase) return fromCompactOnly;
    if (!fromCompactOnly) return fromFullPhrase;
    if (JSON.stringify(fromFullPhrase) === JSON.stringify(fromCompactOnly)) return fromFullPhrase;
    return { OR: [fromFullPhrase, fromCompactOnly] };
  }

  const clauses = terms.map((t) => buildSingleTermBrandWhere(t)).filter(Boolean) as Prisma.BrandProfileWhereInput[];
  if (clauses.length === 0) return null;
  return { AND: clauses };
}

/**
 * Builds AND of optional city + optional categories + optional text clause (for brand search).
 */
export function buildBrandMarketplaceWhere(args: {
  city: string;
  selectedCategoryKeys?: string[];
  textWhere: Prisma.BrandProfileWhereInput | null;
}): Prisma.BrandProfileWhereInput {
  const parts: Prisma.BrandProfileWhereInput[] = [];
  if (args.city) parts.push({ city: args.city });
  const cats = args.selectedCategoryKeys?.filter(Boolean) ?? [];
  if (cats.length > 0) {
    parts.push({
      selectedCategories: { some: { categoryKey: { in: cats.slice(0, 3) } } },
    });
  }
  if (args.textWhere) parts.push(args.textWhere);
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}

/**
 * Builds AND of optional filters + optional text clause (for influencer search on /marka).
 */
export function buildInfluencerMarketplaceWhere(args: {
  city: string;
  selectedCategoryKeys: string[];
  textWhere: Prisma.InfluencerProfileWhereInput | null;
}): Prisma.InfluencerProfileWhereInput {
  const parts: Prisma.InfluencerProfileWhereInput[] = [];
  if (args.city) parts.push({ city: args.city });
  if (args.selectedCategoryKeys.length > 0) {
    parts.push({
      selectedCategories: {
        some: { categoryKey: { in: args.selectedCategoryKeys } },
      },
    });
  }
  if (args.textWhere) parts.push(args.textWhere);
  if (parts.length === 0) return {};
  if (parts.length === 1) return parts[0]!;
  return { AND: parts };
}
