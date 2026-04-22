import type { Prisma } from "@prisma/client";
import {
  buildBrandMarketplaceWhere,
  buildBrandProfileTextWhere,
  buildInfluencerMarketplaceWhere,
  buildInfluencerProfileTextWhere,
  parseMarketplaceSearchQuery,
} from "@/lib/marketplaceTextSearch";
import { scoreBrandMatch, scoreInfluencerMatch, type BrandScoreRow, type InfluencerScoreRow } from "./fuzzyScore";
import { compareLiteralFirstBrand, compareLiteralFirstInfluencer } from "./marketplaceLiteralFirstSort";
import { literalRankBrand, literalRankInfluencer } from "./marketplaceLiteralRank";

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
  bio: true,
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

export type InfluencerSearchHit = Prisma.InfluencerProfileGetPayload<{ select: typeof influencerSearchSelect }> & {
  _matchScore: number;
  _matchReason: "literal" | "typo";
  _fuzzyScore: number;
};

export type BrandSearchHit = Prisma.BrandProfileGetPayload<{ select: typeof brandSearchSelect }> & {
  _matchScore: number;
  _matchReason: "literal" | "typo";
  _fuzzyScore: number;
};

const LITERAL_FETCH = 220;
const BROAD_FETCH = 320;
/** Broad-pool rows must clear this fuzzy floor (typo layer). */
const BROAD_MIN_FUZZY = 42;

function asInfluencerScoreRow(
  row: Prisma.InfluencerProfileGetPayload<{ select: typeof influencerSearchSelect }>,
): InfluencerScoreRow {
  return {
    id: row.id,
    username: row.username,
    city: row.city,
    category: row.category,
    nicheText: row.nicheText,
    bio: row.bio ?? null,
    user: row.user,
    selectedCategories: row.selectedCategories,
  };
}

function asBrandScoreRow(row: Prisma.BrandProfileGetPayload<{ select: typeof brandSearchSelect }>): BrandScoreRow {
  return {
    id: row.id,
    companyName: row.companyName,
    username: row.username,
    city: row.city,
    bio: row.bio,
    website: row.website,
    user: row.user,
    selectedCategories: row.selectedCategories,
  };
}

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
  const qLen = q.trim().length;
  const baseWhere = buildInfluencerMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: args.selectedCategoryKeys,
    textWhere: null,
  });

  if (!q) {
    const rows = await prisma.influencerProfile.findMany({
      where: baseWhere,
      select: influencerSearchSelect,
      take,
      orderBy: { followerCount: "desc" },
    });
    return rows.map((row) => ({
      ...row,
      _matchScore: 100,
      _matchReason: "literal" as const,
      _fuzzyScore: 0,
    }));
  }

  const textWhere = buildInfluencerProfileTextWhere(q);
  const whereLiteral = buildInfluencerMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: args.selectedCategoryKeys,
    textWhere,
  });

  const literalRows = await prisma.influencerProfile.findMany({
    where: whereLiteral,
    select: influencerSearchSelect,
    take: LITERAL_FETCH,
    orderBy: { followerCount: "desc" },
  });

  type Scored = {
    row: Prisma.InfluencerProfileGetPayload<{ select: typeof influencerSearchSelect }>;
    literal: number;
    fuzzy: number;
    source: "literal" | "broad";
  };

  const scored: Scored[] = literalRows.map((row) => {
    const scoreRow = asInfluencerScoreRow(row);
    return {
      row,
      literal: literalRankInfluencer(q, scoreRow),
      fuzzy: qLen <= 2 ? 0 : scoreInfluencerMatch(q, scoreRow),
      source: "literal",
    };
  });

  const maxLiteral = scored.reduce((m, s) => Math.max(m, s.literal), 0);
  const needsBroad =
    qLen >= 3 && (literalRows.length === 0 || literalRows.length < take || maxLiteral < 72);

  if (needsBroad && qLen >= 3) {
    const literalIds = new Set(literalRows.map((r) => r.id));
    const broadWhere: Prisma.InfluencerProfileWhereInput =
      literalIds.size > 0 ? { AND: [baseWhere, { id: { notIn: [...literalIds] } }] } : baseWhere;

    const broadRows = await prisma.influencerProfile.findMany({
      where: broadWhere,
      select: influencerSearchSelect,
      take: BROAD_FETCH,
      orderBy: { followerCount: "desc" },
    });

    for (const row of broadRows) {
      const scoreRow = asInfluencerScoreRow(row);
      const fuzzy = scoreInfluencerMatch(q, scoreRow);
      if (fuzzy < BROAD_MIN_FUZZY) continue;
      const literal = literalRankInfluencer(q, scoreRow);
      scored.push({
        row,
        literal,
        fuzzy,
        source: "broad",
      });
    }
  }

  scored.sort((a, b) =>
    compareLiteralFirstInfluencer(
      { literal: a.literal, fuzzy: a.fuzzy, followerCount: a.row.followerCount },
      { literal: b.literal, fuzzy: b.fuzzy, followerCount: b.row.followerCount },
      qLen,
    ),
  );

  return scored.slice(0, take).map((s) => ({
    ...s.row,
    _matchScore: s.literal,
    _fuzzyScore: s.fuzzy,
    _matchReason: s.source === "broad" ? ("typo" as const) : ("literal" as const),
  }));
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
  const qLen = q.trim().length;
  const catKeys = (args.selectedCategoryKeys ?? []).filter(Boolean).slice(0, 3);

  const baseOnly: Prisma.BrandProfileWhereInput = buildBrandMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: catKeys,
    textWhere: null,
  });

  if (!q) {
    const rows = await prisma.brandProfile.findMany({
      where: baseOnly,
      select: brandSearchSelect,
      take,
      orderBy: { companyName: "asc" },
    });
    return rows.map((row) => ({
      ...row,
      _matchScore: 100,
      _matchReason: "literal" as const,
      _fuzzyScore: 0,
    }));
  }

  const textWhere = buildBrandProfileTextWhere(q);
  const whereLiteral = buildBrandMarketplaceWhere({
    city: args.city.trim(),
    selectedCategoryKeys: catKeys,
    textWhere,
  });

  const literalRows = await prisma.brandProfile.findMany({
    where: whereLiteral,
    select: brandSearchSelect,
    take: LITERAL_FETCH,
    orderBy: { updatedAt: "desc" },
  });

  type Scored = {
    row: Prisma.BrandProfileGetPayload<{ select: typeof brandSearchSelect }>;
    literal: number;
    fuzzy: number;
    source: "literal" | "broad";
  };

  const scored: Scored[] = literalRows.map((row) => {
    const scoreRow = asBrandScoreRow(row);
    return {
      row,
      literal: literalRankBrand(q, scoreRow),
      fuzzy: qLen <= 2 ? 0 : scoreBrandMatch(q, scoreRow),
      source: "literal",
    };
  });

  const maxLiteral = scored.reduce((m, s) => Math.max(m, s.literal), 0);
  const needsBroad = qLen >= 3 && (literalRows.length === 0 || literalRows.length < take || maxLiteral < 72);

  if (needsBroad && qLen >= 3) {
    const literalIds = new Set(literalRows.map((r) => r.id));
    const broadWhere: Prisma.BrandProfileWhereInput =
      literalIds.size > 0 ? { AND: [baseOnly, { id: { notIn: [...literalIds] } }] } : baseOnly;

    const broadRows = await prisma.brandProfile.findMany({
      where: broadWhere,
      select: brandSearchSelect,
      take: BROAD_FETCH,
      orderBy: { updatedAt: "desc" },
    });

    for (const row of broadRows) {
      const scoreRow = asBrandScoreRow(row);
      const fuzzy = scoreBrandMatch(q, scoreRow);
      if (fuzzy < BROAD_MIN_FUZZY) continue;
      const literal = literalRankBrand(q, scoreRow);
      scored.push({
        row,
        literal,
        fuzzy,
        source: "broad",
      });
    }
  }

  scored.sort((a, b) => {
    const c = compareLiteralFirstBrand(
      { literal: a.literal, fuzzy: a.fuzzy },
      { literal: b.literal, fuzzy: b.fuzzy },
      qLen,
    );
    if (c !== 0) return c;
    return a.row.companyName.localeCompare(b.row.companyName, "tr");
  });

  return scored.slice(0, take).map((s) => ({
    ...s.row,
    _matchScore: s.literal,
    _fuzzyScore: s.fuzzy,
    _matchReason: s.source === "broad" ? ("typo" as const) : ("literal" as const),
  }));
}
