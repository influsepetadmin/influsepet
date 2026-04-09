import type { OfferStatus } from "@prisma/client";
import {
  getCounterpartyUserId,
  isOfferParticipant,
  parseRating,
  type OfferForCollaborationReview,
} from "@/lib/offers/reviews";

export { parseRating };

/** İsteğe bağlı kısa not — POST gövdesi ve DB ile uyumlu üst sınır. */
export const COLLABORATION_RATING_REVIEW_TEXT_MAX = 160;

export function parseOptionalReviewText(raw: unknown):
  | { ok: true; text: string | null }
  | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, text: null };
  if (typeof raw !== "string") {
    return { ok: false, error: "Geçersiz not metni." };
  }
  const t = raw.trim();
  if (t.length === 0) return { ok: true, text: null };
  if (t.length > COLLABORATION_RATING_REVIEW_TEXT_MAX) {
    return {
      ok: false,
      error: `Kısa not en fazla ${COLLABORATION_RATING_REVIEW_TEXT_MAX} karakter olabilir.`,
    };
  }
  return { ok: true, text: t };
}

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
    /** Oturum kullanıcısının kaydettiği isteğe bağlı not (varsa). */
    reviewText: string | null;
  };
  /** Karşı tarafın size verdiği puan (varsa). */
  theirs: {
    submitted: boolean;
    rating: number | null;
    /** Karşı tarafın bıraktığı isteğe bağlı not (varsa). */
    reviewText: string | null;
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
  reviewText: string | null;
};

export type CollaborationRatingPostSuccessResponse = {
  success: true;
  message: string;
  rating: CollaborationRatingCreatedSummary;
};
