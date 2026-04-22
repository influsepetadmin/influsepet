import { CATEGORY_KEYS, normalizeCategoryKeysForForm } from "@/lib/categories";
import type { PrismaClient } from "@prisma/client";

const brandCardSelect = {
  id: true,
  userId: true,
  companyName: true,
  profileImageUrl: true,
  city: true,
  website: true,
  createdAt: true,
  updatedAt: true,
  selectedCategories: { select: { categoryKey: true } },
} as const;

const influencerCardSelect = {
  id: true,
  userId: true,
  username: true,
  profileImageUrl: true,
  city: true,
  followerCount: true,
  basePriceTRY: true,
  createdAt: true,
  updatedAt: true,
  nicheText: true,
  selectedCategories: { select: { categoryKey: true } },
} as const;

export type DiscoverBrandSectionRow = {
  id: string;
  userId: string;
  companyName: string;
  profileImageUrl: string | null;
  city: string | null;
  website: string | null;
  createdAt: Date;
  updatedAt: Date;
  selectedCategories: { categoryKey: string }[];
};

export type DiscoverInfluencerSectionRow = {
  id: string;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  city: string | null;
  followerCount: number;
  basePriceTRY: number;
  createdAt: Date;
  updatedAt: Date;
  nicheText: string | null;
  selectedCategories: { categoryKey: string }[];
};

export type SectionReason =
  | "categories"
  | "same_city"
  | "new"
  | "nearby"
  | "featured"
  | "active";

export type DiscoverSection<T> = {
  key: string;
  title: string;
  subtitle: string;
  reason: SectionReason;
  items: T[];
};

function categoryOverlapWhere(keys: string[]): { selectedCategories: { some: { categoryKey: { in: string[] } } } } | null {
  if (keys.length === 0) return null;
  return {
    selectedCategories: {
      some: { categoryKey: { in: keys } },
    },
  };
}

export async function loadBrandDiscoverSections(
  prisma: PrismaClient,
  viewer: {
    city: string | null;
    categoryKeys: string[];
  },
): Promise<{
  forYou: DiscoverSection<DiscoverBrandSectionRow>;
  newest: DiscoverSection<DiscoverBrandSectionRow>;
  nearby: DiscoverSection<DiscoverBrandSectionRow>;
  featured: DiscoverSection<DiscoverBrandSectionRow>;
}> {
  const keys = viewer.categoryKeys.slice(0, 6);
  const catWhere = categoryOverlapWhere(keys);

  const [forYouRows, newestRows, nearbyRows, featuredRows] = await Promise.all([
    catWhere
      ? prisma.brandProfile.findMany({
          where: catWhere,
          select: brandCardSelect,
          take: 8,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.brandProfile.findMany({
      select: brandCardSelect,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    viewer.city?.trim()
      ? prisma.brandProfile.findMany({
          where: { city: viewer.city.trim() },
          select: brandCardSelect,
          take: 8,
          orderBy: { updatedAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.brandProfile.findMany({
      where: { profileImageUrl: { not: null } },
      select: brandCardSelect,
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    forYou: {
      key: "for-you",
      title: "Sana uygun olabilir",
      subtitle: "Seçtiğiniz kategorilerle örtüşen markalar.",
      reason: "categories",
      items: forYouRows as DiscoverBrandSectionRow[],
    },
    newest: {
      key: "newest",
      title: "Yeni katılanlar",
      subtitle: "Son dönemde kayıtlı markalar.",
      reason: "new",
      items: newestRows as DiscoverBrandSectionRow[],
    },
    nearby: {
      key: "nearby",
      title: "Yakınındakiler",
      subtitle: viewer.city ? `Şehir: ${viewer.city}` : "Profilinizde şehir seçtiğinizde kişiselleşir.",
      reason: "nearby",
      items: nearbyRows as DiscoverBrandSectionRow[],
    },
    featured: {
      key: "featured",
      title: "Öne çıkan hesaplar",
      subtitle: "Güncel ve görünür profiller.",
      reason: "active",
      items: featuredRows as DiscoverBrandSectionRow[],
    },
  };
}

export async function loadInfluencerDiscoverSections(
  prisma: PrismaClient,
  viewer: {
    city: string | null;
    categoryKeys: string[];
  },
): Promise<{
  forYou: DiscoverSection<DiscoverInfluencerSectionRow>;
  newest: DiscoverSection<DiscoverInfluencerSectionRow>;
  nearby: DiscoverSection<DiscoverInfluencerSectionRow>;
  featured: DiscoverSection<DiscoverInfluencerSectionRow>;
}> {
  const keys = viewer.categoryKeys.slice(0, 6);
  const catWhere = categoryOverlapWhere(keys);

  const [forYouRows, newestRows, nearbyRows, featuredRows] = await Promise.all([
    catWhere
      ? prisma.influencerProfile.findMany({
          where: catWhere,
          select: influencerCardSelect,
          take: 8,
          orderBy: { followerCount: "desc" },
        })
      : Promise.resolve([]),
    prisma.influencerProfile.findMany({
      select: influencerCardSelect,
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    viewer.city?.trim()
      ? prisma.influencerProfile.findMany({
          where: { city: viewer.city.trim() },
          select: influencerCardSelect,
          take: 8,
          orderBy: { followerCount: "desc" },
        })
      : Promise.resolve([]),
    prisma.influencerProfile.findMany({
      where: { profileImageUrl: { not: null } },
      select: influencerCardSelect,
      take: 8,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return {
    forYou: {
      key: "for-you",
      title: "Sana uygun olabilir",
      subtitle: "Kategorilerinizle uyumlu içerik üreticileri.",
      reason: "categories",
      items: forYouRows as DiscoverInfluencerSectionRow[],
    },
    newest: {
      key: "newest",
      title: "Yeni katılanlar",
      subtitle: "Yeni kayıtlı profiller.",
      reason: "new",
      items: newestRows as DiscoverInfluencerSectionRow[],
    },
    nearby: {
      key: "nearby",
      title: "Yakınındakiler",
      subtitle: viewer.city ? `Şehir: ${viewer.city}` : "Profilinizde şehir ekleyin yakın öneriler için.",
      reason: "nearby",
      items: nearbyRows as DiscoverInfluencerSectionRow[],
    },
    featured: {
      key: "featured",
      title: "Öne çıkan hesaplar",
      subtitle: "Güncellenen ve görünür profiller.",
      reason: "active",
      items: featuredRows as DiscoverInfluencerSectionRow[],
    },
  };
}

export function viewerCategoryKeysFromInfluencer(profile: {
  category: string;
  selectedCategories: { categoryKey: string }[];
}): string[] {
  return normalizeCategoryKeysForForm(
    profile.selectedCategories.map((c) => c.categoryKey),
    profile.category,
  );
}

export function viewerCategoryKeysFromBrand(profile: {
  selectedCategories: { categoryKey: string }[];
}): string[] {
  return normalizeCategoryKeysForForm(profile.selectedCategories.map((c) => c.categoryKey));
}

const allowedCategoryKeySet = new Set<string>(CATEGORY_KEYS);

export type ExploreCategoryCount = { key: string; count: number };
export type ExploreCityCount = { city: string; count: number };

/** Lightweight aggregates + profile rows for Discover “Explore” (no text query). */
export async function loadInfluencerDiscoverExplore(prisma: PrismaClient): Promise<{
  popularCategories: ExploreCategoryCount[];
  trendingCities: ExploreCityCount[];
  suggested: DiscoverInfluencerSectionRow[];
  newest: DiscoverInfluencerSectionRow[];
}> {
  const [catGroups, cityGroups, suggestedRows, newestRows] = await Promise.all([
    prisma.influencerSelectedCategory.groupBy({
      by: ["categoryKey"],
      _count: { _all: true },
      orderBy: { _count: { categoryKey: "desc" } },
      take: 24,
    }),
    prisma.influencerProfile.groupBy({
      by: ["city"],
      where: { city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 16,
    }),
    prisma.influencerProfile.findMany({
      select: influencerCardSelect,
      take: 12,
      orderBy: [{ followerCount: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.influencerProfile.findMany({
      select: influencerCardSelect,
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const popularCategories = catGroups
    .filter((g) => allowedCategoryKeySet.has(g.categoryKey))
    .slice(0, 12)
    .map((g) => ({ key: g.categoryKey, count: g._count._all }));

  const trendingCities = cityGroups
    .filter((g) => g.city != null && String(g.city).trim().length > 0)
    .slice(0, 12)
    .map((g) => ({ city: String(g.city).trim(), count: g._count._all }));

  const suggested = suggestedRows as DiscoverInfluencerSectionRow[];
  const sugIds = new Set(suggested.map((s) => s.id));
  const newest = (newestRows as DiscoverInfluencerSectionRow[]).filter((r) => !sugIds.has(r.id)).slice(0, 12);

  return { popularCategories, trendingCities, suggested, newest };
}

export async function loadBrandDiscoverExplore(prisma: PrismaClient): Promise<{
  popularSectors: ExploreCategoryCount[];
  activeCities: ExploreCityCount[];
  featured: DiscoverBrandSectionRow[];
  newest: DiscoverBrandSectionRow[];
}> {
  const [catGroups, cityGroups, featuredRows, newestRows] = await Promise.all([
    prisma.brandSelectedCategory.groupBy({
      by: ["categoryKey"],
      _count: { _all: true },
      orderBy: { _count: { categoryKey: "desc" } },
      take: 24,
    }),
    prisma.brandProfile.groupBy({
      by: ["city"],
      where: { city: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: 16,
    }),
    prisma.brandProfile.findMany({
      where: { profileImageUrl: { not: null } },
      select: brandCardSelect,
      take: 12,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.brandProfile.findMany({
      select: brandCardSelect,
      take: 20,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const popularSectors = catGroups
    .filter((g) => allowedCategoryKeySet.has(g.categoryKey))
    .slice(0, 12)
    .map((g) => ({ key: g.categoryKey, count: g._count._all }));

  const activeCities = cityGroups
    .filter((g) => g.city != null && String(g.city).trim().length > 0)
    .slice(0, 12)
    .map((g) => ({ city: String(g.city).trim(), count: g._count._all }));

  const featured = featuredRows as DiscoverBrandSectionRow[];
  const featIds = new Set(featured.map((b) => b.id));
  const newest = (newestRows as DiscoverBrandSectionRow[]).filter((b) => !featIds.has(b.id)).slice(0, 12);

  return { popularSectors, activeCities, featured, newest };
}
