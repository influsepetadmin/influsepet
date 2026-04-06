import { prisma } from "@/lib/prisma";

/** Karşı tarafın tüm tamamlanan iş birliklerinde aldığı CollaborationRating özeti (public profile ile aynı mantık). */
export type RateeReputationStats = {
  averageRating: number | null;
  ratingCount: number;
};

/**
 * Birden fazla kullanıcı için `rateeUserId` bazlı ortalama ve adet (tek sorgu).
 */
export async function getRateeReputationByUserIds(
  userIds: string[],
): Promise<Map<string, RateeReputationStats>> {
  const unique = [...new Set(userIds)].filter(Boolean);
  const map = new Map<string, RateeReputationStats>();
  for (const id of unique) {
    map.set(id, { averageRating: null, ratingCount: 0 });
  }
  if (unique.length === 0) return map;

  const grouped = await prisma.collaborationRating.groupBy({
    by: ["rateeUserId"],
    where: {
      rateeUserId: { in: unique },
      offer: { status: "COMPLETED" },
    },
    _avg: { rating: true },
    _count: { _all: true },
  });

  for (const row of grouped) {
    const c = row._count._all;
    const avg = row._avg.rating;
    map.set(row.rateeUserId, {
      ratingCount: c,
      averageRating:
        c > 0 && avg != null ? Math.round(avg * 100) / 100 : null,
    });
  }

  return map;
}
