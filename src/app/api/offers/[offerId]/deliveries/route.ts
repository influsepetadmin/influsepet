import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import {
  canSubmitDelivery,
  DELIVERY_PARSE_REQUIRED,
  DELIVERY_PARSE_TEXT_TOO_LONG,
  type OfferBasics,
} from "@/lib/offers/deliveries";
import { parseOptionalHttpHttpsUrl } from "@/lib/safeUrl";

function isParticipant(offer: OfferBasics, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

function parseDeliveryBody(body: Record<string, unknown>): {
  deliveryUrl: string | null;
  deliveryText: string | null;
  error?: string;
} {
  const rawUrl = typeof body.deliveryUrl === "string" ? body.deliveryUrl.trim() : "";
  const rawText = typeof body.deliveryText === "string" ? body.deliveryText.trim() : "";

  if (!rawUrl && !rawText) {
    return { deliveryUrl: null, deliveryText: null, error: DELIVERY_PARSE_REQUIRED };
  }

  if (rawUrl.length > 2000 || rawText.length > 8000) {
    return { deliveryUrl: null, deliveryText: null, error: DELIVERY_PARSE_TEXT_TOO_LONG };
  }

  if (rawUrl) {
    const safe = parseOptionalHttpHttpsUrl(rawUrl);
    if (safe.ok === false) {
      return { deliveryUrl: null, deliveryText: null, error: safe.error };
    }
    const deliveryUrl = safe.value;
    if (deliveryUrl == null) {
      return { deliveryUrl: null, deliveryText: null, error: "Gecersiz URL." };
    }
    return {
      deliveryUrl,
      deliveryText: rawText || null,
    };
  }

  return {
    deliveryUrl: null,
    deliveryText: rawText || null,
  };
}

export async function GET(
  _request: Request,
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

  const deliveries = await prisma.offerDelivery.findMany({
    where: { offerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      deliveryUrl: true,
      deliveryText: true,
      status: true,
      createdAt: true,
      submittedBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json({ ok: true, deliveries });
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

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const parsed = parseDeliveryBody(body ?? {});
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
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
  const submitCheck = canSubmitDelivery({ offer, sessionUser });
  if (submitCheck.ok === false) {
    const status = submitCheck.code === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json({ error: submitCheck.message, code: submitCheck.code }, { status });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const delivery = await tx.offerDelivery.create({
        data: {
          offerId,
          submittedById: session.uid,
          deliveryUrl: parsed.deliveryUrl,
          deliveryText: parsed.deliveryText,
          status: "SUBMITTED",
        },
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
        data: { status: "DELIVERED" },
        select: {
          id: true,
          status: true,
          brandId: true,
          influencerId: true,
        },
      });

      return { delivery, offer: updatedOffer };
    });

    return NextResponse.json({
      ok: true,
      delivery: result.delivery,
      offer: result.offer,
    });
  } catch {
    return NextResponse.json({ error: "Teslim kaydedilemedi." }, { status: 500 });
  }
}
