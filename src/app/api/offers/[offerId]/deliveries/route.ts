import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { DELIVERY_PARSE_REQUIRED, parseDeliveryUrlAndText } from "@/lib/offers/deliveryPayload";
import { DELIVERY_MEDIA_MAX_FILES } from "@/lib/offers/deliverySubmitConstants";
import { canSubmitDelivery, type OfferBasics } from "@/lib/offers/deliveries";
import {
  maxBytesForValidatedMedia,
  prismaKindFromValidated,
  sanitizeOriginalFilename,
  validateCollaborationMediaBuffer,
} from "@/lib/uploads/collabMediaUpload";
import { deliveryMediaAbsolutePath, saveDeliveryMediaFile } from "@/lib/uploads/deliveryMediaUpload";

function isParticipant(offer: OfferBasics, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

function mediaJsonShape(offerId: string, rows: { id: string; kind: string; mimeType: string; sizeBytes: number; originalFilenameSafe: string | null; createdAt: Date }[]) {
  return rows.map((m) => ({
    id: m.id,
    kind: m.kind,
    mimeType: m.mimeType,
    sizeBytes: m.sizeBytes,
    originalFilenameSafe: m.originalFilenameSafe,
    createdAt: m.createdAt,
    url: `/api/offers/${offerId}/deliveries/media/${m.id}`,
  }));
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
      media: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          kind: true,
          mimeType: true,
          sizeBytes: true,
          originalFilenameSafe: true,
          createdAt: true,
        },
      },
    },
  });

  const out = deliveries.map((d) => ({
    ...d,
    media: mediaJsonShape(offerId, d.media),
  }));

  return NextResponse.json({ ok: true, deliveries: out });
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

  const contentType = request.headers.get("content-type") ?? "";
  let rawUrl = "";
  let rawText = "";
  let files: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
    }
    rawUrl = String(formData.get("deliveryUrl") ?? "").trim();
    rawText = String(formData.get("deliveryText") ?? "").trim();
    const rawFiles = formData.getAll("files");
    files = rawFiles.filter((x): x is File => x instanceof File && x.size > 0);
  } else {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
    rawUrl = typeof body?.deliveryUrl === "string" ? body.deliveryUrl.trim() : "";
    rawText = typeof body?.deliveryText === "string" ? body.deliveryText.trim() : "";
  }

  if (files.length > DELIVERY_MEDIA_MAX_FILES) {
    return NextResponse.json(
      { error: `En fazla ${DELIVERY_MEDIA_MAX_FILES} dosya yukleyebilirsiniz.` },
      { status: 400 },
    );
  }

  const parsed = parseDeliveryUrlAndText({ rawUrl, rawText });
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  if (!parsed.deliveryUrl && !parsed.deliveryText && files.length === 0) {
    return NextResponse.json({ error: DELIVERY_PARSE_REQUIRED }, { status: 400 });
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

  type PreparedFile = {
    kind: ReturnType<typeof prismaKindFromValidated>;
    mime: string;
    storedFilename: string;
    sizeBytes: number;
    originalFilenameSafe: string | null;
  };

  const prepared: PreparedFile[] = [];
  const writtenPaths: string[] = [];

  try {
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const validated = validateCollaborationMediaBuffer(buffer);
      if (validated.ok === false) {
        return NextResponse.json({ error: validated.error }, { status: 400 });
      }
      const maxForKind = maxBytesForValidatedMedia(validated.media);
      if (buffer.length > maxForKind) {
        return NextResponse.json(
          {
            error:
              validated.media.kind === "IMAGE"
                ? "Goruntu en fazla 10 MB olabilir."
                : "Video en fazla 100 MB olabilir.",
          },
          { status: 400 },
        );
      }
      const saved = await saveDeliveryMediaFile(buffer, validated.media);
      writtenPaths.push(saved.storedFilename);
      prepared.push({
        kind: prismaKindFromValidated(validated.media),
        mime: validated.media.mime,
        storedFilename: saved.storedFilename,
        sizeBytes: buffer.length,
        originalFilenameSafe: sanitizeOriginalFilename(file.name),
      });
    }

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

      for (const p of prepared) {
        await tx.offerDeliveryMedia.create({
          data: {
            offerDeliveryId: delivery.id,
            kind: p.kind,
            mimeType: p.mime,
            storedFilename: p.storedFilename,
            sizeBytes: p.sizeBytes,
            originalFilenameSafe: p.originalFilenameSafe,
          },
        });
      }

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

    const mediaRows = await prisma.offerDeliveryMedia.findMany({
      where: { offerDeliveryId: result.delivery.id },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        kind: true,
        mimeType: true,
        sizeBytes: true,
        originalFilenameSafe: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      ok: true,
      delivery: {
        ...result.delivery,
        media: mediaJsonShape(offerId, mediaRows),
      },
      offer: result.offer,
    });
  } catch {
    for (const name of writtenPaths) {
      try {
        await unlink(deliveryMediaAbsolutePath(name));
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json({ error: "Teslim kaydedilemedi." }, { status: 500 });
  }
}
