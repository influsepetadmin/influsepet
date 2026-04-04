import type { OfferStatus } from "@prisma/client";

export type CollaborationCardOffer = {
  id: string;
  title: string;
  campaignName: string | null;
  brief: string;
  offerAmountTRY: number;
  budgetTRY: number | null;
  status: OfferStatus;
  dueDate: string | null;
  deliverableType: string | null;
  deliverableCount: number | null;
  revisionCount: number;
  commissionRate: number;
  commissionTRY: number;
  netPayoutTRY: number;
  createdAt: string;
  updatedAt: string;
  deliveryCount: number;
};

/** Map Prisma offer row to serializable card props (RSC → client). */
export function toCollaborationCardOffer(o: {
  id: string;
  title: string;
  campaignName: string | null;
  brief: string;
  offerAmountTRY: number;
  budgetTRY: number | null;
  status: OfferStatus;
  dueDate: Date | null;
  deliverableType: string | null;
  deliverableCount: number | null;
  revisionCount: number;
  commissionRate: number;
  commissionTRY: number;
  netPayoutTRY: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { deliveries: number };
}): CollaborationCardOffer {
  return {
    id: o.id,
    title: o.title,
    campaignName: o.campaignName,
    brief: o.brief,
    offerAmountTRY: o.offerAmountTRY,
    budgetTRY: o.budgetTRY,
    status: o.status,
    dueDate: o.dueDate ? o.dueDate.toISOString() : null,
    deliverableType: o.deliverableType,
    deliverableCount: o.deliverableCount,
    revisionCount: o.revisionCount,
    commissionRate: o.commissionRate,
    commissionTRY: o.commissionTRY,
    netPayoutTRY: o.netPayoutTRY,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    deliveryCount: o._count?.deliveries ?? 0,
  };
}
