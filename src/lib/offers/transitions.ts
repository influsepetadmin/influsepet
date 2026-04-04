import type { OfferInitiator, OfferStatus, UserRole } from "@prisma/client";

/**
 * Centralized offer workflow rules for the **generic** transition endpoint only.
 *
 * Delivery-driven states (single source of truth = OfferDelivery APIs):
 * - DELIVERED: only after POST /api/offers/[offerId]/deliveries (creates OfferDelivery + sets offer DELIVERED).
 * - COMPLETED: only after POST .../deliveries/[deliveryId]/review with APPROVE.
 * - REVISION_REQUESTED: only after POST .../review with REQUEST_REVISION.
 * These targets are NOT allowed via POST /api/offers/[offerId]/transition.
 *
 * Conservative choices (documented):
 * - CANCELLED: allowed from PENDING, ACCEPTED, IN_PROGRESS for either participant.
 * - DISPUTED: only ADMIN may move DELIVERED → DISPUTED via generic transition (no OfferDelivery row involved).
 * - ACCEPT / REJECT on PENDING: only the non-initiating side.
 */

/** Returned when generic POST /transition targets delivery-only states. */
export const DELIVERY_ONLY_TRANSITION_ERROR_MESSAGE =
  "Bu durum değişikliği genel iş akışı üzerinden yapılamaz. Teslim ve inceleme akışını kullanın.";

export type SessionUser = {
  id: string;
  role: UserRole;
};

export type OfferForTransition = {
  id: string;
  status: OfferStatus;
  brandId: string;
  influencerId: string;
  initiatedBy: OfferInitiator;
};

/**
 * Allowed next statuses for POST /transition only.
 * Do NOT include DELIVERED, COMPLETED, or REVISION_REQUESTED — use delivery APIs.
 */
export const ALLOWED_OFFER_TRANSITIONS: Readonly<Record<OfferStatus, readonly OfferStatus[]>> = {
  PENDING: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["CANCELLED"],
  DELIVERED: ["DISPUTED"],
  REVISION_REQUESTED: ["IN_PROGRESS"],
  COMPLETED: [],
  REJECTED: [],
  CANCELLED: [],
  DISPUTED: [],
};

const TERMINAL_STATUSES: ReadonlySet<OfferStatus> = new Set([
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
  "DISPUTED",
]);

export function isTerminalOfferStatus(status: OfferStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isOfferParticipant(offer: OfferForTransition, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

function isNonInitiatingCounterparty(offer: OfferForTransition, userId: string): boolean {
  if (offer.initiatedBy === "BRAND") {
    return offer.influencerId === userId;
  }
  return offer.brandId === userId;
}

function isInfluencerSide(offer: OfferForTransition, userId: string): boolean {
  return offer.influencerId === userId;
}

function allowedByGraph(current: OfferStatus, next: OfferStatus): boolean {
  const nexts = ALLOWED_OFFER_TRANSITIONS[current];
  return nexts?.includes(next) ?? false;
}

export type TransitionResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

export function canTransitionOffer(input: {
  offer: OfferForTransition;
  sessionUser: SessionUser;
  nextStatus: OfferStatus;
}): TransitionResult {
  const { offer, sessionUser, nextStatus } = input;

  if (offer.status === nextStatus) {
    return { ok: false, code: "NO_OP", message: "Durum zaten ayni." };
  }

  if (isTerminalOfferStatus(offer.status)) {
    return { ok: false, code: "TERMINAL", message: "Bu teklif sonlandirilmis durumda." };
  }

  if (!allowedByGraph(offer.status, nextStatus)) {
    return { ok: false, code: "INVALID_TRANSITION", message: "Bu gecis izinli degil." };
  }

  const uid = sessionUser.id;

  // DISPUTED: admin-only from DELIVERED
  if (nextStatus === "DISPUTED") {
    if (offer.status !== "DELIVERED") {
      return { ok: false, code: "INVALID_TRANSITION", message: "Uyusmazlik sadece teslim sonrasi acilabilir." };
    }
    if (sessionUser.role !== "ADMIN") {
      return { ok: false, code: "FORBIDDEN", message: "Uyusmazlik bildirimi simdilik yalnizca yonetici." };
    }
    return { ok: true };
  }

  // Admin should not use normal participant transitions (except DISPUTED above)
  if (sessionUser.role === "ADMIN") {
    return { ok: false, code: "FORBIDDEN", message: "Bu islem katilimci hesabi gerektirir." };
  }

  if (!isOfferParticipant(offer, uid)) {
    return { ok: false, code: "FORBIDDEN", message: "Bu teklifin tarafi degilsiniz." };
  }

  switch (nextStatus) {
    case "ACCEPTED":
    case "REJECTED":
      if (offer.status !== "PENDING") {
        return { ok: false, code: "INVALID_TRANSITION", message: "Kabul/red yalnizca beklemedeki teklifler icin." };
      }
      if (!isNonInitiatingCounterparty(offer, uid)) {
        return { ok: false, code: "FORBIDDEN", message: "Teklifi sadece karsi taraf kabul edebilir veya reddedebilir." };
      }
      return { ok: true };

    case "CANCELLED":
      return { ok: true };

    case "IN_PROGRESS":
      if (offer.status === "ACCEPTED") {
        if (!isInfluencerSide(offer, uid)) {
          return { ok: false, code: "FORBIDDEN", message: "Isleme almayi yalnizca influencer baslatabilir." };
        }
        return { ok: true };
      }
      if (offer.status === "REVISION_REQUESTED") {
        if (!isInfluencerSide(offer, uid)) {
          return { ok: false, code: "FORBIDDEN", message: "Revizyon sonrasi isleme almayi yalnizca influencer yapabilir." };
        }
        return { ok: true };
      }
      return { ok: false, code: "INVALID_TRANSITION", message: "Gecersiz gecis." };

    default:
      return { ok: false, code: "INVALID_TRANSITION", message: "Desteklenmeyen hedef durum." };
  }
}

export function getAvailableOfferTransitions(input: {
  offer: OfferForTransition;
  sessionUser: SessionUser;
}): OfferStatus[] {
  const { offer, sessionUser } = input;
  const candidates = [...(ALLOWED_OFFER_TRANSITIONS[offer.status] ?? [])];
  const out: OfferStatus[] = [];
  for (const next of candidates) {
    const r = canTransitionOffer({ offer, sessionUser, nextStatus: next });
    if (r.ok) out.push(next);
  }
  return out;
}
