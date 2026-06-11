import type { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Recent items shown on the public influencer profile (first version). */
export const PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT = 6;

/**
 * Public-safe collaboration ratings received by a profile owner.
 * This matches the chat/workspace rating flow that writes CollaborationRating.reviewText.
 */
export function publicInfluencerReviewsWhere(revieweeUserId: string): Prisma.CollaborationRatingWhereInput {
  return {
    rateeUserId: revieweeUserId,
    offer: { status: "COMPLETED" },
  };
}

function publicWrittenCollaborationReviewsWhere(
  revieweeUserId: string,
): Prisma.CollaborationRatingWhereInput {
  return {
    ...publicInfluencerReviewsWhere(revieweeUserId),
    reviewText: { not: null },
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
 * Recent written collaboration review notes for public profile JSON.
 * Average star score and rating count are calculated from the same CollaborationRating model elsewhere.
 */
export async function getRecentPublicReviewsForPublicProfile(
  revieweeUserId: string,
  limit = PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT,
): Promise<PublicProfileRecentReviewJson[]> {
  const where = publicWrittenCollaborationReviewsWhere(revieweeUserId);
  const rows = await prisma.collaborationRating.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      rating: true,
      reviewText: true,
      createdAt: true,
      rater: { select: { role: true } },
    },
  });
  return rows.map((row) => ({
    rating: row.rating,
    comment: row.reviewText,
    createdAt: row.createdAt.toISOString(),
    reviewerTypeLabel: reviewerRolePublicLabel(row.rater.role),
  }));
}

export async function getPublicInfluencerReviewsSectionData(
  influencerUserId: string,
): Promise<PublicInfluencerReviewsSectionData> {
  const where = publicInfluencerReviewsWhere(influencerUserId);
  const writtenWhere = publicWrittenCollaborationReviewsWhere(influencerUserId);

  const [aggregate, rows] = await Promise.all([
    prisma.collaborationRating.aggregate({
      where,
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.collaborationRating.findMany({
      where: writtenWhere,
      orderBy: { createdAt: "desc" },
      take: PUBLIC_INFLUENCER_PROFILE_REVIEWS_LIMIT,
      select: {
        rating: true,
        reviewText: true,
        createdAt: true,
        rater: { select: { role: true } },
      },
    }),
  ]);

  const totalCount = aggregate._count._all;
  const avg = aggregate._avg.rating;
  const averageRating = totalCount > 0 && avg != null ? avg : null;

  const recentReviews: PublicInfluencerReviewCard[] = rows.map((row) => ({
    rating: row.rating,
    comment: row.reviewText,
    createdAt: row.createdAt,
    reviewerTypeLabel: reviewerRolePublicLabel(row.rater.role),
  }));

  return { totalCount, averageRating, recentReviews };
}
