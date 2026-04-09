import { prisma } from "@/lib/prisma";
import { getRecentPublicReviewsForPublicProfile } from "@/lib/publicProfile/influencerPublicReviews";
import {
  mapToPublicProfileByUsernameResponse,
  type PublicProfileByUsernameResponse,
} from "@/lib/publicProfile/publicProfileByUsername";

/**
 * Same payload as GET /api/public-profile/[username], keyed by influencer user id
 * (e.g. brand panel `/profil/influencer/[userId]`).
 */
export async function getPublicProfileByUserId(
  userId: string,
): Promise<PublicProfileByUsernameResponse | null> {
  const profile = await prisma.influencerProfile.findUnique({
    where: { userId },
    select: {
      userId: true,
      username: true,
      profileImageUrl: true,
      bio: true,
      nicheText: true,
      followerCount: true,
      basePriceTRY: true,
      city: true,
      selectedCategories: { select: { categoryKey: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });

  if (!profile || profile.user.role !== "INFLUENCER") {
    return null;
  }

  const uid = profile.userId;

  const [completedCount, ratingAgg, verifiedSocial, recentPublicReviews] = await Promise.all([
    prisma.offer.count({
      where: {
        status: "COMPLETED",
        OR: [{ brandId: uid }, { influencerId: uid }],
      },
    }),
    prisma.collaborationRating.aggregate({
      where: {
        rateeUserId: uid,
        offer: { status: "COMPLETED" },
      },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.socialAccount.findMany({
      where: { userId: uid, isVerified: true },
      select: {
        platform: true,
        username: true,
        profileUrl: true,
        verifiedAt: true,
      },
      orderBy: { platform: "asc" },
    }),
    getRecentPublicReviewsForPublicProfile(uid),
  ]);

  const ratingCount = ratingAgg._count._all;
  const averageRating =
    ratingCount > 0 && ratingAgg._avg.rating != null
      ? Math.round(ratingAgg._avg.rating * 100) / 100
      : null;

  return mapToPublicProfileByUsernameResponse(
    {
      userId: profile.userId,
      username: profile.username,
      profileImageUrl: profile.profileImageUrl,
      bio: profile.bio,
      nicheText: profile.nicheText,
      followerCount: profile.followerCount,
      basePriceTRY: profile.basePriceTRY,
      city: profile.city,
      selectedCategories: profile.selectedCategories,
      user: { id: profile.user.id, name: profile.user.name, role: "INFLUENCER" },
    },
    completedCount,
    averageRating,
    ratingCount,
    verifiedSocial,
    recentPublicReviews,
  );
}
