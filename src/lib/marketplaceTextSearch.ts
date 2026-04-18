import type { Prisma } from "@prisma/client";
import { matchCategoryKeysForSearch } from "@/lib/categories";

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

function addFieldContains(
  or: Prisma.InfluencerProfileWhereInput[],
  field: "username" | "nicheText" | "bio" | "category" | "city",
  primary: string,
  secondary: string | null,
) {
  or.push({ [field]: { contains: primary, mode: "insensitive" } });
  if (secondary) {
    or.push({ [field]: { contains: secondary, mode: "insensitive" } });
  }
}

function addBrandFieldContains(
  or: Prisma.BrandProfileWhereInput[],
  field: "companyName" | "city" | "bio" | "website",
  primary: string,
  secondary: string | null,
) {
  or.push({ [field]: { contains: primary, mode: "insensitive" } });
  if (secondary) {
    or.push({ [field]: { contains: secondary, mode: "insensitive" } });
  }
}

/**
 * OR conditions for influencer marketplace text search (combined with city/category filters via AND).
 */
export function buildInfluencerProfileTextWhere(rawQuery: string): Prisma.InfluencerProfileWhereInput | null {
  const v = getSearchTextVariants(rawQuery);
  if (!v) return null;
  const { primary, secondary } = v;
  const or: Prisma.InfluencerProfileWhereInput[] = [];

  addFieldContains(or, "username", primary, secondary);
  addFieldContains(or, "nicheText", primary, secondary);
  addFieldContains(or, "bio", primary, secondary);
  addFieldContains(or, "category", primary, secondary);
  addFieldContains(or, "city", primary, secondary);

  or.push({ user: { name: { contains: primary, mode: "insensitive" } } });
  if (secondary) {
    or.push({ user: { name: { contains: secondary, mode: "insensitive" } } });
  }

  const catKeys = matchCategoryKeysForSearch(primary);
  if (catKeys.length > 0) {
    or.push({ selectedCategories: { some: { categoryKey: { in: catKeys } } } });
  }

  return { OR: or };
}

/**
 * OR conditions for brand marketplace text search (combined with city filter via AND).
 */
export function buildBrandProfileTextWhere(rawQuery: string): Prisma.BrandProfileWhereInput | null {
  const v = getSearchTextVariants(rawQuery);
  if (!v) return null;
  const { primary, secondary } = v;
  const or: Prisma.BrandProfileWhereInput[] = [];

  addBrandFieldContains(or, "companyName", primary, secondary);
  addBrandFieldContains(or, "city", primary, secondary);
  addBrandFieldContains(or, "bio", primary, secondary);
  addBrandFieldContains(or, "website", primary, secondary);

  or.push({ username: { contains: primary, mode: "insensitive" } });
  if (secondary) {
    or.push({ username: { contains: secondary, mode: "insensitive" } });
  }

  or.push({ user: { name: { contains: primary, mode: "insensitive" } } });
  if (secondary) {
    or.push({ user: { name: { contains: secondary, mode: "insensitive" } } });
  }

  const catKeys = matchCategoryKeysForSearch(primary);
  if (catKeys.length > 0) {
    or.push({ selectedCategories: { some: { categoryKey: { in: catKeys } } } });
  }

  return { OR: or };
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
