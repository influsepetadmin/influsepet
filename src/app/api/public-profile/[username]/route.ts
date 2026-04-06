import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getRecentPublicReviewsForPublicProfile } from "@/lib/publicProfile/influencerPublicReviews";
import { mapToPublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";

/**
 * Public influencer profile by handle (InfluencerProfile.username).
 * Does not expose brands (no username field on BrandProfile in v1).
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ username: string }> },
) {
  const { username: raw } = await context.params;
  const trimmed = decodeURIComponent(raw ?? "").trim();
  if (!trimmed) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile = await prisma.influencerProfile.findFirst({
    where: {
      username: { equals: trimmed, mode: "insensitive" },
    },
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
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = profile.userId;

  const [completedCount, ratingAgg, verifiedSocial, recentPublicReviews] = await Promise.all([
    prisma.offer.count({
      where: {
        status: "COMPLETED",
        OR: [{ brandId: userId }, { influencerId: userId }],
      },
    }),
    prisma.collaborationRating.aggregate({
      where: {
        rateeUserId: userId,
        offer: { status: "COMPLETED" },
      },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.socialAccount.findMany({
      where: { userId, isVerified: true },
      select: {
        platform: true,
        username: true,
        profileUrl: true,
        verifiedAt: true,
      },
      orderBy: { platform: "asc" },
    }),
    getRecentPublicReviewsForPublicProfile(userId),
  ]);

  const ratingCount = ratingAgg._count._all;
  const averageRating =
    ratingCount > 0 && ratingAgg._avg.rating != null
      ? Math.round(ratingAgg._avg.rating * 100) / 100
      : null;

  const body = mapToPublicProfileByUsernameResponse(
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

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
