import { getCategoryLabel } from "@/lib/categories";
import type { SocialPlatform } from "@prisma/client";

/** GET /api/public-brand-profile/[username] — public-safe JSON. */
export type PublicBrandProfileResponse = {
  id: string;
  /** Şirket / marka adı (hero başlık) */
  name: string;
  /** Hesap sahibi görünen ad (küçük metin) */
  contactName: string;
  username: string;
  role: "BRAND";
  bio: string | null;
  avatarUrl: string | null;
  city: string | null;
  website: string | null;
  categories: { key: string; label: string }[];
  verifiedSocialAccounts: {
    platform: SocialPlatform;
    username: string;
    profileUrl: string | null;
    verifiedAt: string | null;
  }[];
  completedCollaborationsCount: number;
  ratingAverage: number | null;
  ratingCount: number;
};

type BrandProfileRow = {
  userId: string;
  username: string;
  companyName: string;
  profileImageUrl: string | null;
  bio: string | null;
  website: string | null;
  city: string | null;
  selectedCategories: { categoryKey: string }[];
  user: { id: string; name: string; role: "BRAND" };
};

export function mapToPublicBrandProfileResponse(
  profile: BrandProfileRow,
  completedCollaborationsCount: number,
  ratingAverage: number | null,
  ratingCount: number,
  verifiedSocial: {
    platform: SocialPlatform;
    username: string;
    profileUrl: string | null;
    verifiedAt: Date | null;
  }[],
): PublicBrandProfileResponse {
  return {
    id: profile.user.id,
    name: profile.companyName,
    contactName: profile.user.name,
    username: profile.username,
    role: "BRAND",
    bio: profile.bio,
    avatarUrl: profile.profileImageUrl,
    city: profile.city,
    website: profile.website,
    categories: profile.selectedCategories.map((c) => ({
      key: c.categoryKey,
      label: getCategoryLabel(c.categoryKey),
    })),
    verifiedSocialAccounts: verifiedSocial.map((s) => ({
      platform: s.platform,
      username: s.username,
      profileUrl: s.profileUrl,
      verifiedAt: s.verifiedAt ? s.verifiedAt.toISOString() : null,
    })),
    completedCollaborationsCount,
    ratingAverage,
    ratingCount,
  };
}
