import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import type { OfferBasics } from "@/lib/offers/deliveries";
import { deliveryMediaAbsolutePath } from "@/lib/uploads/deliveryMediaUpload";

function isParticipant(offer: OfferBasics, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

type RouteCtx = { params: Promise<{ offerId: string; mediaId: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const { offerId, mediaId } = await ctx.params;
  if (!offerId?.trim() || !mediaId?.trim()) {
    return NextResponse.json({ error: "Gecersiz." }, { status: 400 });
  }

  const media = await prisma.offerDeliveryMedia.findUnique({
    where: { id: mediaId },
    include: {
      delivery: {
        select: {
          offerId: true,
          offer: {
            select: { id: true, brandId: true, influencerId: true, status: true, initiatedBy: true },
          },
        },
      },
    },
  });

  if (!media || media.delivery.offerId !== offerId) {
    return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
  }

  const offer = media.delivery.offer;
  if (!isParticipant(offer, session.uid)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let absolute: string;
  try {
    absolute = deliveryMediaAbsolutePath(media.storedFilename);
  } catch {
    return NextResponse.json({ error: "Gecersiz dosya." }, { status: 500 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(absolute);
  } catch {
    return NextResponse.json({ error: "Dosya okunamadi." }, { status: 500 });
  }

  const downloadName = media.originalFilenameSafe ?? `delivery-${media.id}`;

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(buf.length),
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(downloadName)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
