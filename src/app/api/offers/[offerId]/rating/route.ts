import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import {
  canSubmitCollaborationRating,
  computeRatingFlowState,
  parseOptionalReviewText,
  parseRating,
  type CollaborationRatingGetResponse,
  type CollaborationRatingPostSuccessResponse,
} from "@/lib/offers/collaborationRating";
import { isOfferParticipant, type OfferForCollaborationReview } from "@/lib/offers/reviews";

/** Next.js may pass `params` as optional or segment values as `string | string[]`. */
async function resolveOfferIdFromContext(context: {
  params?: Promise<Record<string, string | string[] | undefined>>;
}): Promise<string> {
  const raw = context.params ? await context.params : {};
  const v = raw.offerId;
  const id = Array.isArray(v) ? v[0] : v;
  return typeof id === "string" ? id : "";
}

export const dynamic = "force-dynamic";

async function loadOfferForRating(offerId: string) {
  return prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      brandId: true,
      influencerId: true,
      status: true,
    },
  });
}

export async function GET(
  _request: Request,
  context: { params?: Promise<Record<string, string | string[] | undefined>> },
) {
  try {
    const session = await getSessionPayload();
    if (!session) {
      return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
    }

    const offerId = (await resolveOfferIdFromContext(context)).trim();
    if (!offerId) {
      return NextResponse.json({ error: "Teklif ID gerekli." }, { status: 400 });
    }

    const offer = await loadOfferForRating(offerId);
    if (!offer) {
      return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
    }

    const forOffer: OfferForCollaborationReview = offer;
    if (!isOfferParticipant(forOffer, session.uid)) {
      return NextResponse.json({ error: "Bu teklifin tarafı değilsiniz." }, { status: 403 });
    }

    const counterpartyUserId =
      offer.brandId === session.uid ? offer.influencerId : offer.brandId;

    /** Rating I gave (rater = me). */
    const [myRow, theirRow] = await Promise.all([
      prisma.collaborationRating.findFirst({
        where: { offerId, raterUserId: session.uid },
        select: { rating: true, rateeUserId: true, reviewText: true },
      }),
      /** Rating I received: rater = counterparty, ratee = me. */
      prisma.collaborationRating.findFirst({
        where: {
          offerId,
          raterUserId: counterpartyUserId,
          rateeUserId: session.uid,
        },
        select: { rating: true, reviewText: true },
      }),
    ]);

    const iRated = myRow != null;
    const theyRated = theirRow != null;

    const body: CollaborationRatingGetResponse = {
      ok: true,
      offerId: offer.id,
      offerStatus: offer.status,
      eligible: offer.status === "COMPLETED",
      counterpartyUserId,
      mine: {
        submitted: iRated,
        rating: myRow?.rating ?? null,
        rateeUserId: myRow?.rateeUserId ?? null,
        reviewText: myRow?.reviewText ?? null,
      },
      theirs: {
        submitted: theyRated,
        rating: theirRow?.rating ?? null,
        reviewText: theirRow?.reviewText ?? null,
      },
      ratingState: computeRatingFlowState({ iRated, theyRated }),
    };

    return NextResponse.json(body);
  } catch {
    return NextResponse.json(
      { error: "Puan bilgisi yüklenirken bir sunucu hatası oluştu." },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: { params?: Promise<Record<string, string | string[] | undefined>> },
) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const offerId = (await resolveOfferIdFromContext(context)).trim();
  if (!offerId) {
    return NextResponse.json({ error: "Teklif ID gerekli." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ratingParsed = parseRating(body?.rating);
  if ("error" in ratingParsed) {
    return NextResponse.json({ error: ratingParsed.error }, { status: 400 });
  }

  const textParsed = parseOptionalReviewText(body?.reviewText);
  if (textParsed.ok === false) {
    return NextResponse.json({ error: textParsed.error }, { status: 400 });
  }

  const offer = await loadOfferForRating(offerId);
  if (!offer) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }

  const forOffer: OfferForCollaborationReview = offer;
  const check = canSubmitCollaborationRating({
    offer: forOffer,
    raterUserId: session.uid,
  });

  if (check.ok === false) {
    const status = check.code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: check.message, code: check.code }, { status });
  }

  const { rateeUserId } = check;
  if (rateeUserId === session.uid) {
    return NextResponse.json({ error: "Kendinizi puanlayamazsınız.", code: "INVALID_TARGET" }, { status: 400 });
  }

  const existing = await prisma.collaborationRating.findFirst({
    where: {
      offerId,
      raterUserId: session.uid,
      rateeUserId,
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      {
        error: "Bu iş birliği için zaten puan verdiniz.",
        code: "DUPLICATE_RATING",
      },
      { status: 409 },
    );
  }

  try {
    const row = await prisma.collaborationRating.create({
      data: {
        offerId,
        raterUserId: session.uid,
        rateeUserId,
        rating: ratingParsed.rating,
        reviewText: textParsed.text,
      },
      select: {
        id: true,
        rating: true,
        offerId: true,
        raterUserId: true,
        rateeUserId: true,
        reviewText: true,
      },
    });

    const body: CollaborationRatingPostSuccessResponse = {
      success: true,
      message: "Puanınız kaydedildi.",
      rating: {
        id: row.id,
        offerId: row.offerId,
        raterUserId: row.raterUserId,
        rateeUserId: row.rateeUserId,
        rating: row.rating,
        reviewText: row.reviewText,
      },
    };

    return NextResponse.json(body);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        {
          error: "Bu iş birliği için zaten puan verdiniz.",
          code: "DUPLICATE_RATING",
        },
        { status: 409 },
      );
    }
    throw e;
  }
}
