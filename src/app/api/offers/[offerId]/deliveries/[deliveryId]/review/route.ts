import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { canReviewDelivery, type OfferBasics } from "@/lib/offers/deliveries";

function isParticipant(offer: OfferBasics, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

type ReviewAction = "APPROVE" | "REQUEST_REVISION";

function isReviewAction(v: unknown): v is ReviewAction {
  return v === "APPROVE" || v === "REQUEST_REVISION";
}

export async function POST(
  request: Request,
  context: { params: Promise<{ offerId: string; deliveryId: string }> },
) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const { offerId, deliveryId } = await context.params;
  if (!offerId?.trim() || !deliveryId?.trim()) {
    return NextResponse.json({ error: "Teklif veya teslim ID gerekli." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = body?.action;
  if (!isReviewAction(action)) {
    return NextResponse.json({ error: "action: APPROVE veya REQUEST_REVISION gerekli." }, { status: 400 });
  }

  const delivery = await prisma.offerDelivery.findFirst({
    where: { id: deliveryId, offerId },
    select: {
      id: true,
      status: true,
      offerId: true,
    },
  });

  if (!delivery) {
    return NextResponse.json({ error: "Teslim bulunamadi." }, { status: 404 });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      brandId: true,
      influencerId: true,
      status: true,
      initiatedBy: true,
    },
  });

  if (!offer) {
    return NextResponse.json({ error: "Teklif bulunamadi." }, { status: 404 });
  }

  if (!isParticipant(offer, session.uid)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const sessionUser = { id: user.id, role: user.role };

  const reviewCheck = canReviewDelivery({ offer, sessionUser, delivery });
  if (reviewCheck.ok === false) {
    const status = reviewCheck.code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: reviewCheck.message, code: reviewCheck.code }, { status });
  }

  const nextOfferStatus = action === "APPROVE" ? ("COMPLETED" as const) : ("REVISION_REQUESTED" as const);
  const nextDeliveryStatus = action === "APPROVE" ? ("APPROVED" as const) : ("REVISION_REQUESTED" as const);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updatedDelivery = await tx.offerDelivery.update({
        where: { id: deliveryId },
        data: { status: nextDeliveryStatus },
        select: {
          id: true,
          offerId: true,
          submittedById: true,
          deliveryUrl: true,
          deliveryText: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      const updatedOffer = await tx.offer.update({
        where: { id: offerId },
        data: { status: nextOfferStatus },
        select: {
          id: true,
          status: true,
          brandId: true,
          influencerId: true,
        },
      });

      return { delivery: updatedDelivery, offer: updatedOffer };
    });

    return NextResponse.json({
      ok: true,
      delivery: result.delivery,
      offer: result.offer,
    });
  } catch {
    return NextResponse.json({ error: "Inceleme kaydedilemedi." }, { status: 500 });
  }
}
