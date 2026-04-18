import type { Prisma } from "@prisma/client";
import { matchCategoryKeysForSearch } from "@/lib/categories";
import {
  buildBrandMarketplaceWhere,
  buildBrandProfileTextWhere,
  buildInfluencerMarketplaceWhere,
  buildInfluencerProfileTextWhere,
  parseMarketplaceSearchQuery,
} from "@/lib/marketplaceTextSearch";
import { tokenizeSearchQuery } from "./searchNormalize";
import {
  MIN_FUZZY_SCORE,
  MIN_FUZZY_SCORE_FALLBACK,
  scoreBrandMatch,
  scoreInfluencerMatch,
  type BrandScoreRow,
  type InfluencerScoreRow,
} from "./fuzzyScore";

function flattenOrClause(w: Prisma.InfluencerProfileWhereInput | null): Prisma.InfluencerProfileWhereInput[] {
  if (!w) return [];
  if ("OR" in w && Array.isArray(w.OR)) return w.OR as Prisma.InfluencerProfileWhereInput[];
  return [w];
}

function flattenBrandOrClause(w: Prisma.BrandProfileWhereInput | null): Prisma.BrandProfileWhereInput[] {
  if (!w) return [];
  if ("OR" in w && Array.isArray(w.OR)) return w.OR as Prisma.BrandProfileWhereInput[];
  return [w];
}

/** Widen Prisma OR with per-token contains + category keys per token. */
function extendInfluencerTextWhereWithTokens(
  base: Prisma.InfluencerProfileWhereInput | null,
  rawQuery: string,
): Prisma.InfluencerProfileWhereInput | null {
  const tokens = tokenizeSearchQuery(rawQuery, 2);
  const tokenOrs: Prisma.InfluencerProfileWhereInput[] = [];
  for (const tok of tokens) {
    if (tok.length < 2) continue;
    tokenOrs.push({ username: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ city: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ nicheText: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ category: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ user: { name: { contains: tok, mode: "insensitive" } } });
    const keys = matchCategoryKeysForSearch(tok);
    if (keys.length) {
      tokenOrs.push({ selectedCategories: { some: { categoryKey: { in: keys } } } });
    }
  }
  const baseOrs = flattenOrClause(base);
  const all = [...baseOrs, ...tokenOrs];
  if (all.length === 0) return null;
  return { OR: all };
}

function extendBrandTextWhereWithTokens(
  base: Prisma.BrandProfileWhereInput | null,
  rawQuery: string,
): Prisma.BrandProfileWhereInput | null {
  const tokens = tokenizeSearchQuery(rawQuery, 2);
  const tokenOrs: Prisma.BrandProfileWhereInput[] = [];
  for (const tok of tokens) {
    if (tok.length < 2) continue;
    tokenOrs.push({ companyName: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ city: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ bio: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ username: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ website: { contains: tok, mode: "insensitive" } });
    tokenOrs.push({ user: { name: { contains: tok, mode: "insensitive" } } });
    const keys = matchCategoryKeysForSearch(tok);
    if (keys.length) {
      tokenOrs.push({ selectedCategories: { some: { categoryKey: { in: keys } } } });
    }
  }
  const baseOrs = flattenBrandOrClause(base);
  const all = [...baseOrs, ...tokenOrs];
  if (all.length === 0) return null;
  return { OR: all };
}

const influencerSearchSelect = {
  id: true,
  userId: true,
  username: true,
  profileImageUrl: true,
  city: true,
  followerCount: true,
  basePriceTRY: true,
  category: true,
  nicheText: true,
  selectedCategories: { select: { categoryKey: true } },
  user: { select: { name: true } },
} as const;

const brandSearchSelect = {
  id: true,
  userId: true,
  companyName: true,
  username: true,
  profileImageUrl: true,
  city: true,
  bio: true,
  website: true,
  selectedCategories: { select: { categoryKey: true } },
  user: { select: { name: true } },
} as const;

export type InfluencerSearchHit = InfluencerScoreRow & { _matchScore: number };
export type BrandSearchHit = BrandScoreRow & { _matchScore: number };

export async function runInfluencerMarketplaceSearch(
  prisma: import("@prisma/client").PrismaClient,
  args: {
    city: string;
    selectedCategoryKeys: string[];
    q: string;
    take?: number;
  },
): Promise<InfluencerSearchHit[]> {
  const take = args.take ?? 30;
  const q = parseMarketplaceSearchQuery(args.q);
  const baseWhere = buildInfluencerMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: args.selectedCategoryKeys,
    textWhere: null,
  });

  if (!q) {
    const rows = (await prisma.influencerProfile.findMany({
      where: baseWhere,
      select: influencerSearchSelect,
      take,
      orderBy: { followerCount: "desc" },
    })) as InfluencerScoreRow[];
    return rows.map((row) => ({ ...row, _matchScore: 100 }));
  }

  const legacyText = buildInfluencerProfileTextWhere(q);
  const tokenText = extendInfluencerTextWhereWithTokens(legacyText, q);
  const textWhere = tokenText ?? legacyText;

  const where = buildInfluencerMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: args.selectedCategoryKeys,
    textWhere,
  });

  let rows = (await prisma.influencerProfile.findMany({
    where,
    select: influencerSearchSelect,
    take: 180,
    orderBy: { updatedAt: "desc" },
  })) as InfluencerScoreRow[];

  let scored = rows
    .map((row) => ({ row, score: scoreInfluencerMatch(q, row) }))
    .filter((x) => x.score >= MIN_FUZZY_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length < 6 && q.length >= 3) {
    const broad = (await prisma.influencerProfile.findMany({
      where: baseWhere,
      select: influencerSearchSelect,
      take: 450,
      orderBy: { followerCount: "desc" },
    })) as InfluencerScoreRow[];
    const seen = new Set(scored.map((s) => s.row.id));
    const extra = broad
      .filter((r) => !seen.has(r.id))
      .map((row) => ({ row, score: scoreInfluencerMatch(q, row) }))
      .filter((x) => x.score >= MIN_FUZZY_SCORE_FALLBACK)
      .sort((a, b) => b.score - a.score);
    scored = [...scored, ...extra].sort((a, b) => b.score - a.score);
  }

  const out: InfluencerSearchHit[] = scored.slice(0, take).map((s) => ({
    ...s.row,
    _matchScore: s.score,
  }));
  return out;
}

export async function runBrandMarketplaceSearch(
  prisma: import("@prisma/client").PrismaClient,
  args: {
    city: string;
    selectedCategoryKeys?: string[];
    q: string;
    take?: number;
  },
): Promise<BrandSearchHit[]> {
  const take = args.take ?? 30;
  const q = parseMarketplaceSearchQuery(args.q);
  const catKeys = (args.selectedCategoryKeys ?? []).filter(Boolean).slice(0, 3);

  const baseOnly: Prisma.BrandProfileWhereInput = buildBrandMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: catKeys,
    textWhere: null,
  });

  if (!q) {
    const rows = (await prisma.brandProfile.findMany({
      where: baseOnly,
      select: brandSearchSelect,
      take,
      orderBy: { companyName: "asc" },
    })) as BrandScoreRow[];
    return rows.map((row) => ({ ...row, _matchScore: 100 }));
  }

  const legacyText = buildBrandProfileTextWhere(q);
  const tokenText = extendBrandTextWhereWithTokens(legacyText, q);
  const textWhere = tokenText ?? legacyText;

  const where = buildBrandMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: catKeys,
    textWhere,
  });

  let rows = (await prisma.brandProfile.findMany({
    where,
    select: brandSearchSelect,
    take: 180,
    orderBy: { updatedAt: "desc" },
  })) as BrandScoreRow[];

  let scored = rows
    .map((row) => ({ row, score: scoreBrandMatch(q, row) }))
    .filter((x) => x.score >= MIN_FUZZY_SCORE)
    .sort((a, b) => b.score - a.score);

  if (scored.length < 6 && q.length >= 3) {
    const broad = (await prisma.brandProfile.findMany({
      where: baseOnly,
      select: brandSearchSelect,
      take: 450,
      orderBy: { updatedAt: "desc" },
    })) as BrandScoreRow[];
    const seen = new Set(scored.map((s) => s.row.id));
    const extra = broad
      .filter((r) => !seen.has(r.id))
      .map((row) => ({ row, score: scoreBrandMatch(q, row) }))
      .filter((x) => x.score >= MIN_FUZZY_SCORE_FALLBACK)
      .sort((a, b) => b.score - a.score);
    scored = [...scored, ...extra].sort((a, b) => b.score - a.score);
  }

  return scored.slice(0, take).map((s) => ({
    ...s.row,
    _matchScore: s.score,
  }));
}
