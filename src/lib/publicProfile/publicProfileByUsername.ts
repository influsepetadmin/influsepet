import { getCategoryLabel } from "@/lib/categories";
import type {
  PortfolioPlatform,
  SocialAccountVerificationStatus,
  SocialPlatform,
} from "@prisma/client";
import type { PublicProfileRecentReviewJson } from "@/lib/publicProfile/influencerPublicReviews";

export type PublicProfilePortfolioItem = {
  platform: PortfolioPlatform;
  title: string | null;
  url: string;
  createdAt: string;
};

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
    isVerified: boolean;
    verificationStatus: SocialAccountVerificationStatus;
    verifiedAt: string | null;
  }[];
  portfolioItems: PublicProfilePortfolioItem[];
  completedCollaborationsCount: number;
  /** Ortalama yıldız: CollaborationRating (tamamlanan teklifler), Review ile karıştırılmaz. */
  averageRating: number | null;
  ratingCount: number;
  /** Opsiyonel metin değerlendirmeler (CollaborationRating.reviewText); hero ortalaması aynı rating kaynağından gelir. */
  recentPublicReviews: PublicProfileRecentReviewJson[];
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
  portfolioItems: {
    platform: PortfolioPlatform;
    title: string | null;
    url: string;
    createdAt: Date;
  }[];
  user: { id: string; name: string; role: "INFLUENCER" };
};

export function mapToPublicProfileByUsernameResponse(
  profile: ProfileRow,
  completedCollaborationsCount: number,
  averageRating: number | null,
  ratingCount: number,
  socialAccounts: {
    platform: SocialPlatform;
    username: string;
    profileUrl: string | null;
    isVerified: boolean;
    verificationStatus: SocialAccountVerificationStatus;
    verifiedAt: Date | null;
  }[],
  recentPublicReviews: PublicProfileRecentReviewJson[],
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
    verifiedSocialAccounts: socialAccounts.map((s) => ({
      platform: s.platform,
      username: s.username,
      profileUrl: s.profileUrl,
      isVerified: s.isVerified,
      verificationStatus: s.verificationStatus,
      verifiedAt: s.verifiedAt ? s.verifiedAt.toISOString() : null,
    })),
    portfolioItems: profile.portfolioItems.map((item) => ({
      platform: item.platform,
      title: item.title,
      url: item.url,
      createdAt: item.createdAt.toISOString(),
    })),
    completedCollaborationsCount,
    averageRating,
    ratingCount,
    recentPublicReviews,
  };
}
