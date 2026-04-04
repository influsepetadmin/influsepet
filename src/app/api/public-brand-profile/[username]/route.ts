import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mapToPublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";

/**
 * Public brand profile by handle (BrandProfile.username).
 * 404 if username missing or unknown.
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

  const profile = await prisma.brandProfile.findFirst({
    where: {
      username: { equals: trimmed, mode: "insensitive" },
    },
    select: {
      userId: true,
      username: true,
      companyName: true,
      profileImageUrl: true,
      bio: true,
      website: true,
      city: true,
      selectedCategories: { select: { categoryKey: true } },
      user: { select: { id: true, name: true, role: true } },
    },
  });

  if (!profile?.username || profile.user.role !== "BRAND") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userId = profile.userId;

  const [completedCount, ratingAgg, verifiedSocial] = await Promise.all([
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
  ]);

  const ratingCount = ratingAgg._count._all;
  const ratingAverage =
    ratingCount > 0 && ratingAgg._avg.rating != null
      ? Math.round(ratingAgg._avg.rating * 100) / 100
      : null;

  const body = mapToPublicBrandProfileResponse(
    {
      userId: profile.userId,
      username: profile.username,
      companyName: profile.companyName,
      profileImageUrl: profile.profileImageUrl,
      bio: profile.bio,
      website: profile.website,
      city: profile.city,
      selectedCategories: profile.selectedCategories,
      user: { id: profile.user.id, name: profile.user.name, role: "BRAND" },
    },
    completedCount,
    ratingAverage,
    ratingCount,
    verifiedSocial,
  );

  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
