import type { BrandProfile, InfluencerProfile, InfluencerSelectedCategory } from "@prisma/client";

type InfluencerWithCategories = InfluencerProfile & {
  selectedCategories: InfluencerSelectedCategory[];
};

export type ProfileCompletionSection = "general" | "social" | "portfolio" | "business";

export type ProfileCompletionItem = {
  key: string;
  label: string;
  completed: boolean;
  section: ProfileCompletionSection;
};

export type ProfileCompletionResult = {
  percent: number;
  completedCount: number;
  totalCount: number;
  remainingCount: number;
  isComplete: boolean;
  items: ProfileCompletionItem[];
};

type InfluencerCompletionInput = {
  profile: InfluencerProfile | null | undefined;
  displayName: string | null | undefined;
  selectedCategoryKeys: string[] | null | undefined;
  socialAccountCount: number | null | undefined;
  verifiedSocialAccountCount: number | null | undefined;
  portfolioItemCount: number | null | undefined;
};

type BrandCompletionInput = {
  profile: (BrandProfile & { selectedCategories?: { categoryKey: string }[] }) | null | undefined;
  socialAccountCount: number | null | undefined;
  verifiedSocialAccountCount: number | null | undefined;
};

function completionResult(items: ProfileCompletionItem[]): ProfileCompletionResult {
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const remainingCount = totalCount - completedCount;
  return {
    percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
    completedCount,
    totalCount,
    remainingCount,
    isComplete: totalCount > 0 && remainingCount === 0,
    items,
  };
}

/**
 * Panelde özet kartı göstermek için: zorunlu alanlar dolu mu?
 * (API / form alanları değişmedi; sadece UI kararı.)
 */
export function isInfluencerDashboardProfileComplete(
  profile: InfluencerWithCategories | null | undefined,
  selectedCategoryKeys: string[],
): boolean {
  if (!profile) return false;
  if (!profile.username?.trim()) return false;
  if (!profile.city?.trim()) return false;
  if (profile.basePriceTRY < 1) return false;
  if (selectedCategoryKeys.length === 0) return false;
  return true;
}

export function computeInfluencerProfileCompletion({
  profile,
  displayName,
  selectedCategoryKeys,
  socialAccountCount,
  verifiedSocialAccountCount,
  portfolioItemCount,
}: InfluencerCompletionInput): ProfileCompletionResult {
  const hasCategoryOrNiche =
    (selectedCategoryKeys?.some((key) => key.trim().length > 0) ?? false) || Boolean(profile?.nicheText?.trim());

  return completionResult([
    {
      key: "photo",
      label: "Profil fotoğrafı ekle",
      completed: Boolean(profile?.profileImageUrl?.trim()),
      section: "general",
    },
    { key: "name", label: "Görünen adını tamamla", completed: Boolean(displayName?.trim()), section: "general" },
    { key: "city", label: "Şehir ekle", completed: Boolean(profile?.city?.trim()), section: "general" },
    { key: "category", label: "Kategori veya niş seç", completed: hasCategoryOrNiche, section: "general" },
    { key: "price", label: "Baz fiyat ekle", completed: (profile?.basePriceTRY ?? 0) > 0, section: "general" },
    { key: "social", label: "Sosyal hesap ekle", completed: (socialAccountCount ?? 0) > 0, section: "social" },
    {
      key: "verified-social",
      label: "Sosyal hesabını doğrula",
      completed: (verifiedSocialAccountCount ?? 0) > 0,
      section: "social",
    },
    {
      key: "portfolio",
      label: "Portföy öğesi ekle",
      completed: (portfolioItemCount ?? 0) > 0,
      section: "portfolio",
    },
    { key: "about", label: "Hakkında alanını doldur", completed: Boolean(profile?.bio?.trim()), section: "general" },
  ]);
}

export function computeBrandProfileCompletion({
  profile,
  socialAccountCount,
  verifiedSocialAccountCount,
}: BrandCompletionInput): ProfileCompletionResult {
  const hasCategory = profile?.selectedCategories?.some((category) => category.categoryKey.trim().length > 0) ?? false;

  return completionResult([
    {
      key: "photo",
      label: "Marka logosu ekle",
      completed: Boolean(profile?.profileImageUrl?.trim()),
      section: "general",
    },
    {
      key: "company",
      label: "Marka adını tamamla",
      completed: Boolean(profile?.companyName?.trim()),
      section: "general",
    },
    { key: "city", label: "Şehir ekle", completed: Boolean(profile?.city?.trim()), section: "general" },
    { key: "category", label: "Sektör veya kategori seç", completed: hasCategory, section: "general" },
    { key: "about", label: "Marka hakkında alanını doldur", completed: Boolean(profile?.bio?.trim()), section: "general" },
    {
      key: "social",
      label: "Sosyal hesap ekle",
      completed: (socialAccountCount ?? 0) > 0,
      section: "social",
    },
    {
      key: "verified-social",
      label: "Sosyal hesabını doğrula",
      completed: (verifiedSocialAccountCount ?? 0) > 0,
      section: "social",
    },
  ]);
}

export function isBrandDashboardProfileComplete(profile: BrandProfile | null | undefined): boolean {
  if (!profile) return false;
  if (!profile.companyName?.trim()) return false;
  if (!profile.city?.trim()) return false;
  return true;
}

export function truncateText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}
