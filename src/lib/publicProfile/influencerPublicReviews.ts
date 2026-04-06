import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Recent items shown on the public influencer profile (first version). */
export const PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT = 6;

/**
 * Public-safe reviews for an influencer: left by counterparties after completed collaborations,
 * opted in via isPublic, and tied to a COMPLETED offer (same bar as collaboration review creation).
 */
export function publicInfluencerReviewsWhere(influencerUserId: string): Prisma.ReviewWhereInput {
  return {
    revieweeUserId: influencerUserId,
    isPublic: true,
    offer: { status: "COMPLETED" },
  };
}

export type PublicInfluencerReviewCard = {
  rating: number;
  comment: string | null;
  createdAt: Date;
  reviewerTypeLabel: string;
};

export type PublicInfluencerReviewsSectionData = {
  totalCount: number;
  averageRating: number | null;
  recentReviews: PublicInfluencerReviewCard[];
};

const REVIEWER_ROLE_LABEL: Record<UserRole, string> = {
  BRAND: "Marka",
  INFLUENCER: "Influencer",
  ADMIN: "Yönetici",
};

/** Public badge label for reviewer role (no PII). */
export function reviewerRolePublicLabel(role: UserRole): string {
  return REVIEWER_ROLE_LABEL[role];
}

export function formatPublicReviewDate(createdAt: Date): string {
  try {
    return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(createdAt);
  } catch {
    return createdAt.toISOString().slice(0, 10);
  }
}

export function formatAverageRating(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(rounded);
}

/**
 * Backend-side selection for the public influencer profile reviews block.
 * Does not return offer IDs, amounts, or reviewer PII — only role for type badge.
 */
/** JSON-serializable row for public profile API (`/api/public-profile`, `/api/public-brand-profile`). */
export type PublicProfileRecentReviewJson = {
  rating: number;
  comment: string | null;
  createdAt: string;
  reviewerTypeLabel: string;
};

/**
 * Recent text reviews (Review model, isPublic) for public profile JSON — not used for average star score
 * (that comes from CollaborationRating elsewhere).
 */
export async function getRecentPublicReviewsForPublicProfile(
  revieweeUserId: string,
  limit = PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT,
): Promise<PublicProfileRecentReviewJson[]> {
  const where = publicInfluencerReviewsWhere(revieweeUserId);
  const rows = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      rating: true,
      comment: true,
      createdAt: true,
      reviewer: { select: { role: true } },
    },
  });
  return rows.map((row) => ({
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    reviewerTypeLabel: reviewerRolePublicLabel(row.reviewer.role),
  }));
}

export async function getPublicInfluencerReviewsSectionData(
  influencerUserId: string,
): Promise<PublicInfluencerReviewsSectionData> {
  const where = publicInfluencerReviewsWhere(influencerUserId);

  const [aggregate, rows] = await Promise.all([
    prisma.review.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT,
      select: {
        rating: true,
        comment: true,
        createdAt: true,
        reviewer: { select: { role: true } },
      },
    }),
  ]);

  const totalCount = aggregate._count._all;
  const avg = aggregate._avg.rating;
  const averageRating = totalCount > 0 && avg != null ? avg : null;

  const recentReviews: PublicInfluencerReviewCard[] = rows.map((row) => ({
    rating: row.rating,
    comment: row.comment,
    createdAt: row.createdAt,
    reviewerTypeLabel: reviewerRolePublicLabel(row.reviewer.role),
  }));

  return { totalCount, averageRating, recentReviews };
}
