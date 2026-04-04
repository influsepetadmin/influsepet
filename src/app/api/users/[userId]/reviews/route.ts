import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  publicInfluencerReviewsWhere,
  reviewerRolePublicLabel,
} from "@/lib/publicProfile/influencerPublicReviews";

/**
 * Public, minimal JSON for reputation UIs: reviews received by a user, safe fields only.
 * - isPublic = true
 * - offer.status = COMPLETED (aligned with collaboration review creation rules)
 * No offer amounts, chat, delivery URLs, or internal offer IDs.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ userId: string }> },
) {
  const { userId } = await context.params;
  if (!userId?.trim()) {
    return NextResponse.json({ error: "Kullanıcı ID gerekli." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
  }

  const where = publicInfluencerReviewsWhere(userId);

  const [aggregate, reviews] = await Promise.all([
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { role: true } },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    totalCount: aggregate._count._all,
    averageRating: aggregate._count._all > 0 && aggregate._avg.rating != null ? aggregate._avg.rating : null,
    reviews: reviews.map((r) => ({
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt.toISOString(),
      reviewerTypeLabel: reviewerRolePublicLabel(r.reviewer.role),
    })),
  });
}
