/** Shared Prisma select for influencer dashboard offer lists (CollaborationCard). */
export const INFLUENCER_OFFER_DASHBOARD_SELECT = {
  id: true,
  title: true,
  campaignName: true,
  brief: true,
  offerAmountTRY: true,
  budgetTRY: true,
  commissionRate: true,
  commissionTRY: true,
  netPayoutTRY: true,
  status: true,
  initiatedBy: true,
  brandId: true,
  influencerId: true,
  dueDate: true,
  deliverableType: true,
  deliverableCount: true,
  revisionCount: true,
  createdAt: true,
  updatedAt: true,
  conversation: { select: { id: true } },
  _count: { select: { deliveries: true } },
} as const;

export const INFLUENCER_OFFER_WITH_BRAND_SELECT = {
  ...INFLUENCER_OFFER_DASHBOARD_SELECT,
  brand: {
    select: {
      id: true,
      name: true,
      brand: { select: { companyName: true } },
    },
  },
} as const;
