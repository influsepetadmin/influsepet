import type { OfferStatus } from "@prisma/client";

type OfferRow = { status: OfferStatus };

const STATUS_KEYS: { key: string; match: OfferStatus[] | null }[] = [
  { key: "tumu", match: null },
  { key: "bekleyen", match: ["PENDING"] },
  {
    key: "kabul",
    match: ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"],
  },
  { key: "reddedilen", match: ["REJECTED", "CANCELLED"] },
];

/** Mevcut sekmedeki listeden durum chip sayıları (UI için; filtre mantığı değişmez). */
export function countOffersByStatusFilter<T extends OfferRow>(
  list: T[],
  filterKey: string,
): number {
  const rule = STATUS_KEYS.find((s) => s.key === filterKey);
  if (!rule?.match) return list.length;
  return list.filter((o) => rule.match!.includes(o.status)).length;
}
