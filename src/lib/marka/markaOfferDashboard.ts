import { INFLUENCER_OFFER_DASHBOARD_SELECT } from "@/lib/influencer/influencerOfferDashboard";

/** Offer row shape for marka CollaborationCard lists (same base fields as influencer dashboard). */
export const BRAND_OFFER_DASHBOARD_SELECT = INFLUENCER_OFFER_DASHBOARD_SELECT;

/** Offer + influencer side for marka panel (counterparty display + transitions). */
export const BRAND_OFFER_WITH_INFLUENCER_SELECT = {
  ...INFLUENCER_OFFER_DASHBOARD_SELECT,
  influencer: {
    select: {
      id: true,
      name: true,
      influencer: { select: { username: true } },
    },
  },
} as const;
