import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import {
  canCreateCollaborationReview,
  isOfferParticipant,
  parseComment,
  parseIsPublic,
  parseRating,
  type OfferForCollaborationReview,
} from "@/lib/offers/reviews";

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

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, brandId: true, influencerId: true, status: true },
  });

  if (!offer) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }

  if (!isOfferParticipant(offer, session.uid)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const reviews = await prisma.review.findMany({
    where: { offerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      offerId: true,
      reviewerUserId: true,
      revieweeUserId: true,
      rating: true,
      comment: true,
      isPublic: true,
      createdAt: true,
      updatedAt: true,
      reviewer: { select: { id: true, name: true, role: true } },
      reviewee: { select: { id: true, name: true, role: true } },
    },
  });

  return NextResponse.json({ ok: true, reviews });
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

  const commentParsed = parseComment(body?.comment);
  if ("error" in commentParsed) {
    return NextResponse.json({ error: commentParsed.error }, { status: 400 });
  }

  const isPublic = parseIsPublic(body?.isPublic);

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      brandId: true,
      influencerId: true,
      status: true,
    },
  });

  if (!offer) {
    return NextResponse.json({ error: "Teklif bulunamadı." }, { status: 404 });
  }

  const forOffer: OfferForCollaborationReview = offer;
  const check = canCreateCollaborationReview({
    offer: forOffer,
    reviewerUserId: session.uid,
  });
  if (check.ok === false) {
    const status = check.code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: check.message, code: check.code }, { status });
  }

  const { revieweeUserId } = check;

  try {
    const review = await prisma.review.create({
      data: {
        offerId,
        reviewerUserId: session.uid,
        revieweeUserId,
        rating: ratingParsed.rating,
        comment: commentParsed.comment,
        isPublic,
      },
      select: {
        id: true,
        offerId: true,
        reviewerUserId: true,
        revieweeUserId: true,
        rating: true,
        comment: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        reviewer: { select: { id: true, name: true, role: true } },
        reviewee: { select: { id: true, name: true, role: true } },
      },
    });

    return NextResponse.json({ ok: true, review });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json(
        { error: "Bu iş birliği için zaten bir değerlendirme gönderdiniz.", code: "DUPLICATE_REVIEW" },
        { status: 409 },
      );
    }
    throw e;
  }
}
