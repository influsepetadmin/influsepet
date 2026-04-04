import { NextResponse } from "next/server";
import { OfferStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import {
  canTransitionOffer,
  DELIVERY_ONLY_TRANSITION_ERROR_MESSAGE,
  getAvailableOfferTransitions,
  type OfferForTransition,
} from "@/lib/offers/transitions";

function isOfferStatus(value: unknown): value is OfferStatus {
  return typeof value === "string" && Object.values(OfferStatus).includes(value as OfferStatus);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const { offerId } = await context.params;
  if (!offerId?.trim()) {
    return NextResponse.json({ error: "Teklif ID gerekli." }, { status: 400 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown>;
  const nextRaw = body?.nextStatus;
  if (!isOfferStatus(nextRaw)) {
    return NextResponse.json({ error: "Gecerli nextStatus gerekli." }, { status: 400 });
  }
  const nextStatus = nextRaw;

  if (nextStatus === "DELIVERED" || nextStatus === "COMPLETED" || nextStatus === "REVISION_REQUESTED") {
    return NextResponse.json(
      {
        error: DELIVERY_ONLY_TRANSITION_ERROR_MESSAGE,
        code: "DELIVERY_ONLY_STATE",
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: {
      id: true,
      status: true,
      brandId: true,
      influencerId: true,
      initiatedBy: true,
      title: true,
      brief: true,
      offerAmountTRY: true,
      budgetTRY: true,
      campaignName: true,
      deliverableType: true,
      deliverableCount: true,
      dueDate: true,
      revisionCount: true,
      usageRights: true,
      notes: true,
      commissionRate: true,
      commissionTRY: true,
      netPayoutTRY: true,
      createdAt: true,
      updatedAt: true,
      conversation: { select: { id: true } },
    },
  });

  if (!offer) {
    return NextResponse.json({ error: "Teklif bulunamadi." }, { status: 404 });
  }

  const sessionUser = { id: user.id, role: user.role };
  const forTransition: OfferForTransition = {
    id: offer.id,
    status: offer.status,
    brandId: offer.brandId,
    influencerId: offer.influencerId,
    initiatedBy: offer.initiatedBy,
  };

  const check = canTransitionOffer({ offer: forTransition, sessionUser, nextStatus });
  if (check.ok === false) {
    const status = check.code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: check.message, code: check.code }, { status });
  }

  try {
    const updated = await prisma.offer.update({
      where: { id: offerId },
      data: { status: nextStatus },
      select: {
        id: true,
        status: true,
        brandId: true,
        influencerId: true,
        initiatedBy: true,
        title: true,
        brief: true,
        offerAmountTRY: true,
        budgetTRY: true,
        campaignName: true,
        deliverableType: true,
        deliverableCount: true,
        dueDate: true,
        revisionCount: true,
        usageRights: true,
        notes: true,
        commissionRate: true,
        commissionTRY: true,
        netPayoutTRY: true,
        createdAt: true,
        updatedAt: true,
        conversation: { select: { id: true } },
      },
    });

    const nextFor = {
      id: updated.id,
      status: updated.status,
      brandId: updated.brandId,
      influencerId: updated.influencerId,
      initiatedBy: updated.initiatedBy,
    };
    const availableNext = getAvailableOfferTransitions({ offer: nextFor, sessionUser });

    return NextResponse.json({
      ok: true,
      offer: updated,
      availableNextTransitions: availableNext,
    });
  } catch {
    return NextResponse.json({ error: "Guncelleme basarisiz." }, { status: 500 });
  }
}
