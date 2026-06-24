import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { canSubmitDelivery, type OfferBasics } from "@/lib/offers/deliveries";
import {
  DELIVERY_MEDIA_PART_SIZE_BYTES,
  extensionForDeliveryMediaMime,
  maxBytesForDeliveryMediaMime,
} from "@/lib/uploads/privateDeliveryMedia";
import { getPrivateDeliveryMediaStorageConfig } from "@/lib/uploads/privateDeliveryMediaGateway";
import {
  PRIVATE_MEDIA_TICKET_VERSION,
  signPrivateMediaTicket,
} from "@/lib/uploads/privateMediaTicket";

type TicketRequestBody = {
  filename?: unknown;
  mimeType?: unknown;
  sizeBytes?: unknown;
};

function isParticipant(offer: OfferBasics, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

function jsonError(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ offerId: string }> },
) {
  const config = getPrivateDeliveryMediaStorageConfig();
  if (config.mode === "local") {
    return jsonError("Delivery R2 media mode is disabled.", "DELIVERY_R2_DISABLED", 409);
  }
  if (config.mode === "error") {
    return jsonError("Teslim dosya depolama ayari eksik. Lutfen daha sonra tekrar deneyin.", config.code, 503);
  }

  const session = await getSessionPayload();
  if (!session) {
    return jsonError("Oturum bulunamadi.", "UNAUTHENTICATED", 401);
  }

  const { offerId } = await context.params;
  if (!offerId?.trim()) {
    return jsonError("Teklif ID gerekli.", "INVALID_OFFER_ID", 400);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });
  if (!user) {
    return jsonError("Kullanici bulunamadi.", "USER_NOT_FOUND", 404);
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
    return jsonError("Teklif bulunamadi.", "OFFER_NOT_FOUND", 404);
  }
  if (!isParticipant(offer, session.uid)) {
    return jsonError("Yetkisiz.", "FORBIDDEN", 403);
  }

  const submitCheck = canSubmitDelivery({ offer, sessionUser: { id: user.id, role: user.role } });
  if (submitCheck.ok === false) {
    return jsonError(submitCheck.message, submitCheck.code, submitCheck.code === "FORBIDDEN" ? 403 : 400);
  }

  const body = (await request.json().catch(() => null)) as TicketRequestBody | null;
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType.trim().toLowerCase() : "";
  const sizeBytes = typeof body?.sizeBytes === "number" ? body.sizeBytes : NaN;
  if (!mimeType || !Number.isSafeInteger(sizeBytes) || sizeBytes <= 0) {
    return jsonError("Dosya bilgisi gecersiz.", "DELIVERY_FILE_INVALID", 400);
  }

  const ext = extensionForDeliveryMediaMime(mimeType);
  const maxBytes = maxBytesForDeliveryMediaMime(mimeType);
  if (!ext || !maxBytes) {
    return jsonError("Desteklenmeyen dosya turu (JPEG, PNG, WebP, MP4, MOV, WebM).", "DELIVERY_FILE_UNSUPPORTED", 400);
  }
  if (sizeBytes > maxBytes) {
    return jsonError("Dosya boyutu siniri asildi.", "DELIVERY_FILE_TOO_LARGE", 400);
  }

  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000;
  const ticket = signPrivateMediaTicket(
    {
      version: PRIVATE_MEDIA_TICKET_VERSION,
      audience: "delivery-media:upload",
      offerId,
      actorUserId: session.uid,
      mimeType,
      declaredSize: sizeBytes,
      maxBytes,
      iat: now,
      exp: expiresAt,
      nonce: randomUUID(),
    },
    config.ticketSecret,
  );

  return NextResponse.json({
    ok: true,
    gatewayUrl: config.origin,
    ticket,
    partSizeBytes: DELIVERY_MEDIA_PART_SIZE_BYTES,
    expiresAt,
  });
}
