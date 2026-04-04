import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import {
  canSubmitCollaborationRating,
  computeRatingFlowState,
  parseRating,
  type CollaborationRatingGetResponse,
} from "@/lib/offers/collaborationRating";
import { isOfferParticipant, type OfferForCollaborationReview } from "@/lib/offers/reviews";

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
  context: { params: Promise<{ offerId: string }> },
) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { offerId } = await context.params;
  if (!offerId?.trim()) {
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

  const [myRow, theirRow] = await Promise.all([
    prisma.collaborationRating.findFirst({
      where: { offerId, raterUserId: session.uid },
      select: { rating: true, rateeUserId: true },
    }),
    prisma.collaborationRating.findFirst({
      where: {
        offerId,
        raterUserId: counterpartyUserId,
        rateeUserId: session.uid,
      },
      select: { rating: true },
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
    },
    theirs: {
      submitted: theyRated,
      rating: theirRow?.rating ?? null,
    },
    ratingState: computeRatingFlowState({ iRated, theyRated }),
  };

  return NextResponse.json(body);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadı." }, { status: 401 });
  }

  const { offerId } = await context.params;
  if (!offerId?.trim()) {
    return NextResponse.json({ error: "Teklif ID gerekli." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const ratingParsed = parseRating(body?.rating);
  if ("error" in ratingParsed) {
    return NextResponse.json({ error: ratingParsed.error }, { status: 400 });
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
      },
      select: {
        rating: true,
        offerId: true,
        raterUserId: true,
        rateeUserId: true,
      },
    });

    return NextResponse.json({
      success: true,
      rating: row.rating,
      offerId: row.offerId,
      raterUserId: row.raterUserId,
      rateeUserId: row.rateeUserId,
    });
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
