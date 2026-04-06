import type { OfferStatus } from "@prisma/client";
import {
  getCounterpartyUserId,
  isOfferParticipant,
  parseRating,
  type OfferForCollaborationReview,
} from "@/lib/offers/reviews";

export { parseRating };

export type OfferForCollaborationRating = OfferForCollaborationReview;

/** Chat / client için GET yanıtında kullanılan özet durum. */
export type CollaborationRatingFlowState = "neither" | "mine_only" | "theirs_only" | "both";

export function assertParticipant(
  offer: OfferForCollaborationRating,
  userId: string,
): { ok: true; counterpartyUserId: string } | { ok: false; code: "NOT_PARTICIPANT" } {
  if (!isOfferParticipant(offer, userId)) {
    return { ok: false, code: "NOT_PARTICIPANT" };
  }
  const counterpartyUserId = getCounterpartyUserId(offer, userId);
  if (!counterpartyUserId) {
    return { ok: false, code: "NOT_PARTICIPANT" };
  }
  return { ok: true, counterpartyUserId };
}

export function canSubmitCollaborationRating(input: {
  offer: OfferForCollaborationRating;
  raterUserId: string;
}): { ok: true; rateeUserId: string } | { ok: false; code: string; message: string } {
  const { offer, raterUserId } = input;

  if (offer.status !== "COMPLETED") {
    return {
      ok: false,
      code: "INVALID_STATE",
      message: "Puan yalnızca tamamlanan iş birlikleri için verilebilir.",
    };
  }

  const part = assertParticipant(offer, raterUserId);
  if (!part.ok) {
    return { ok: false, code: "FORBIDDEN", message: "Bu teklifin tarafı değilsiniz." };
  }

  return { ok: true, rateeUserId: part.counterpartyUserId };
}

export function computeRatingFlowState(input: {
  iRated: boolean;
  theyRated: boolean;
}): CollaborationRatingFlowState {
  const { iRated, theyRated } = input;
  if (iRated && theyRated) return "both";
  if (iRated) return "mine_only";
  if (theyRated) return "theirs_only";
  return "neither";
}

export type CollaborationRatingGetResponse = {
  ok: true;
  offerId: string;
  offerStatus: OfferStatus;
  /** Puan göndermek için uygun mu (COMPLETED). */
  eligible: boolean;
  counterpartyUserId: string;
  /** Oturum açan kullanıcının verdiği puan (varsa). */
  mine: {
    submitted: boolean;
    rating: number | null;
    rateeUserId: string | null;
  };
  /** Karşı tarafın size verdiği puan (varsa). */
  theirs: {
    submitted: boolean;
    rating: number | null;
  };
  /** İki yönlü puan akışının özeti (chat UI için). */
  ratingState: CollaborationRatingFlowState;
};

/** POST /api/offers/[offerId]/rating başarı gövdesi (Review API’sinden ayrı). */
export type CollaborationRatingCreatedSummary = {
  id: string;
  offerId: string;
  raterUserId: string;
  rateeUserId: string;
  rating: number;
};

export type CollaborationRatingPostSuccessResponse = {
  success: true;
  message: string;
  rating: CollaborationRatingCreatedSummary;
};
