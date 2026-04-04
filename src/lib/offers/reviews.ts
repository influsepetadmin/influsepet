import type { OfferStatus } from "@prisma/client";

/**
 * Collaboration reviews (post-completion ratings between offer participants).
 *
 * Rules are conservative and enforced server-side:
 * - Only COMPLETED offers may receive reviews.
 * - Only the two offer participants (brandId / influencerId) may act; reviewer is always one of them.
 * - Reviewee is always the opposite participant (never self).
 * - At most one review per reviewer per offer (DB: @@unique([offerId, reviewerUserId])).
 * - Rating must be integer 1–5.
 */

export const REVIEW_RATING_MIN = 1;
export const REVIEW_RATING_MAX = 5;
export const REVIEW_COMMENT_MAX_LENGTH = 4000;

export type OfferForCollaborationReview = {
  id: string;
  brandId: string;
  influencerId: string;
  status: OfferStatus;
};

export function isOfferParticipant(offer: OfferForCollaborationReview, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

/** Returns the other participant, or null if userId is not on this offer. */
export function getCounterpartyUserId(offer: OfferForCollaborationReview, participantUserId: string): string | null {
  if (offer.brandId === participantUserId) return offer.influencerId;
  if (offer.influencerId === participantUserId) return offer.brandId;
  return null;
}

export type CreateCollaborationReviewResult =
  | { ok: true; revieweeUserId: string }
  | { ok: false; code: string; message: string };

export function canCreateCollaborationReview(input: {
  offer: OfferForCollaborationReview;
  reviewerUserId: string;
}): CreateCollaborationReviewResult {
  const { offer, reviewerUserId } = input;

  if (offer.status !== "COMPLETED") {
    return {
      ok: false,
      code: "INVALID_STATE",
      message: "Değerlendirme yalnızca tamamlanan iş birlikleri için yapılabilir.",
    };
  }

  const revieweeUserId = getCounterpartyUserId(offer, reviewerUserId);
  if (!revieweeUserId) {
    return { ok: false, code: "FORBIDDEN", message: "Bu teklifin tarafı değilsiniz." };
  }

  return { ok: true, revieweeUserId };
}

export function parseRating(value: unknown): { rating: number } | { error: string } {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { error: "Puan 1 ile 5 arasında bir tam sayı olmalıdır." };
  }
  if (value < REVIEW_RATING_MIN || value > REVIEW_RATING_MAX) {
    return { error: "Puan 1 ile 5 arasında olmalıdır." };
  }
  return { rating: value };
}

export function parseComment(value: unknown): { comment: string | null } | { error: string } {
  if (value === undefined || value === null) {
    return { comment: null };
  }
  if (typeof value !== "string") {
    return { error: "Yorum metni geçersiz." };
  }
  const t = value.trim();
  if (t.length > REVIEW_COMMENT_MAX_LENGTH) {
    return { error: "Yorum çok uzun." };
  }
  return { comment: t.length ? t : null };
}

export function parseIsPublic(value: unknown): boolean {
  if (typeof value === "boolean") return value;
  return true;
}
