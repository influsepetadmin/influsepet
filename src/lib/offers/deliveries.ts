import type { DeliveryStatus, OfferInitiator, OfferStatus } from "@prisma/client";
import type { SessionUser } from "./transitions";

/**
 * Minimal offer shape for delivery permission checks (keeps helpers free of full Prisma types).
 */
export type OfferBasics = {
  id: string;
  status: OfferStatus;
  brandId: string;
  influencerId: string;
  initiatedBy: OfferInitiator;
};

export type DeliveryCheckResult = { ok: true } | { ok: false; code: string; message: string };

/**
 * Submission rules (conservative):
 * - Only the influencer participant (offer.influencerId) may submit; we key off user id, not only role,
 *   so the correct account always acts even if roles were inconsistent in data.
 * - Offer must be IN_PROGRESS or REVISION_REQUESTED (revize sonrasi yeni teslim).
 * - Moving the offer to DELIVERED happens only in POST /deliveries after this row is created.
 */
export function canSubmitDelivery(input: {
  offer: OfferBasics;
  sessionUser: SessionUser;
}): DeliveryCheckResult {
  const { offer, sessionUser } = input;

  if (offer.influencerId !== sessionUser.id) {
    return { ok: false, code: "FORBIDDEN", message: "Teslimi yalnizca influencer gonderebilir." };
  }
  if (offer.status !== "IN_PROGRESS" && offer.status !== "REVISION_REQUESTED") {
    return {
      ok: false,
      code: "INVALID_STATE",
      message: "Teslim yalnizca islemde veya revize asamasinda gonderilebilir.",
    };
  }
  return { ok: true };
}

/**
 * Review rules (conservative):
 * - Only the brand participant (offer.brandId) with role BRAND may review (matches offer transition rules).
 * - Offer must be DELIVERED (brand reviews after influencer marked delivery).
 * - Only SUBMITTED deliveries are reviewable; APPROVED / REVISION_REQUESTED are terminal for that row.
 */
export function canReviewDelivery(input: {
  offer: OfferBasics;
  sessionUser: SessionUser;
  delivery: { status: DeliveryStatus };
}): DeliveryCheckResult {
  const { offer, sessionUser, delivery } = input;

  if (offer.brandId !== sessionUser.id) {
    return { ok: false, code: "FORBIDDEN", message: "Incelemeyi yalnizca marka yapabilir." };
  }
  if (sessionUser.role !== "BRAND") {
    return { ok: false, code: "FORBIDDEN", message: "Marka hesabi gerekli." };
  }
  if (offer.status !== "DELIVERED") {
    return {
      ok: false,
      code: "INVALID_STATE",
      message: "Inceleme yalnizca teslim sonrasi (DELIVERED) yapilabilir.",
    };
  }
  if (delivery.status !== "SUBMITTED") {
    return {
      ok: false,
      code: "INVALID_DELIVERY",
      message: "Bu teslim kaydi icin inceleme yapilamaz.",
    };
  }
  return { ok: true };
}
