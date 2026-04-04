import { getCategoryLabel } from "@/lib/categories";
import type { SocialPlatform } from "@prisma/client";

/** GET /api/public-profile/[username] — public-safe JSON (no UI). */
export type PublicProfileByUsernameResponse = {
  id: string;
  name: string;
  displayName: string;
  username: string;
  role: "INFLUENCER";
  bio: string | null;
  avatarUrl: string | null;
  city: string | null;
  followerCount: number;
  basePriceTRY: number;
  categories: { key: string; label: string }[];
  nicheText: string | null;
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

type ProfileRow = {
  userId: string;
  username: string;
  profileImageUrl: string | null;
  bio: string | null;
  nicheText: string | null;
  followerCount: number;
  basePriceTRY: number;
  city: string | null;
  selectedCategories: { categoryKey: string }[];
  user: { id: string; name: string; role: "INFLUENCER" };
};

export function mapToPublicProfileByUsernameResponse(
  profile: ProfileRow,
  completedCollaborationsCount: number,
  ratingAverage: number | null,
  ratingCount: number,
  verifiedSocial: {
    platform: SocialPlatform;
    username: string;
    profileUrl: string | null;
    verifiedAt: Date | null;
  }[],
): PublicProfileByUsernameResponse {
  return {
    id: profile.user.id,
    name: profile.user.name,
    displayName: profile.user.name,
    username: profile.username,
    role: "INFLUENCER",
    bio: profile.bio,
    avatarUrl: profile.profileImageUrl,
    city: profile.city,
    followerCount: profile.followerCount,
    basePriceTRY: profile.basePriceTRY,
    categories: profile.selectedCategories.map((c) => ({
      key: c.categoryKey,
      label: getCategoryLabel(c.categoryKey),
    })),
    nicheText: profile.nicheText,
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
