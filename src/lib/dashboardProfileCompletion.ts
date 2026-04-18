import type { BrandProfile, InfluencerProfile, InfluencerSelectedCategory } from "@prisma/client";

type InfluencerWithCategories = InfluencerProfile & {
  selectedCategories: InfluencerSelectedCategory[];
};

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

/** Panel özet kartı için 0–100; kullanıcı adı, şehir, fiyat, kategori ve profil fotoğrafı ağırlıklı. */
export function computeInfluencerProfileCompletionPercent(
  profile: InfluencerWithCategories | null | undefined,
  selectedCategoryKeys: string[],
): number {
  if (!profile) return 0;
  let n = 0;
  const parts = 5;
  if (profile.username?.trim()) n++;
  if (profile.city?.trim()) n++;
  if (profile.basePriceTRY >= 1) n++;
  if (selectedCategoryKeys.length > 0) n++;
  if (profile.profileImageUrl?.trim()) n++;
  return Math.round((n / parts) * 100);
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
