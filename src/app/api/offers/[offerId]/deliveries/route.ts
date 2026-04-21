import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { DELIVERY_PARSE_REQUIRED, parseDeliveryUrlAndText } from "@/lib/offers/deliveryPayload";
import {
  DELIVERY_MEDIA_MAX_FILES,
  DELIVERY_VIDEO_MAX_BYTES,
  deliveryImageTooLargeMessage,
  deliveryVideoTooLargeMessage,
} from "@/lib/offers/deliverySubmitConstants";
import { maxBytesForDeliveryMedia } from "@/lib/offers/deliveryMediaServer";
import { canSubmitDelivery, type OfferBasics } from "@/lib/offers/deliveries";
import { COLLAB_IMAGE_MAX_BYTES } from "@/lib/uploads/collabMediaLimits";
import {
  prismaKindFromValidated,
  sanitizeOriginalFilename,
  validateCollaborationMediaBuffer,
  type ValidatedCollabMedia,
} from "@/lib/uploads/collabMediaUpload";
import { deliveryMediaAbsolutePath, saveDeliveryMediaFile } from "@/lib/uploads/deliveryMediaUpload";

function isParticipant(offer: OfferBasics, userId: string): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}

function isLikelyVideoFile(file: Pick<File, "type" | "name">): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name);
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
      return NextResponse.json(
        { error: "Form verisi okunamadi. Baglantiyi kontrol edip tekrar deneyin.", code: "DELIVERY_FORM_INVALID" },
        { status: 400 },
      );
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
      { error: `En fazla ${DELIVERY_MEDIA_MAX_FILES} dosya yukleyebilirsiniz.`, code: "DELIVERY_TOO_MANY_FILES" },
      { status: 400 },
    );
  }

  const parsed = parseDeliveryUrlAndText({ rawUrl, rawText });
  if (parsed.error) {
    return NextResponse.json({ error: parsed.error, code: "DELIVERY_TEXT_INVALID" }, { status: 400 });
  }

  if (!parsed.deliveryUrl && !parsed.deliveryText && files.length === 0) {
    return NextResponse.json({ error: DELIVERY_PARSE_REQUIRED, code: "DELIVERY_PROOF_REQUIRED" }, { status: 400 });
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

  const writtenPaths: string[] = [];

  try {
    type WorkItem = {
      buffer: Buffer;
      validated: ValidatedCollabMedia;
      originalFilenameSafe: string | null;
    };
    const work: WorkItem[] = [];

    for (const file of files) {
      const likelyVideo = isLikelyVideoFile(file);
      const earlyMax = likelyVideo ? DELIVERY_VIDEO_MAX_BYTES : COLLAB_IMAGE_MAX_BYTES;
      if (file.size > earlyMax) {
        return NextResponse.json(
          {
            error: likelyVideo ? deliveryVideoTooLargeMessage() : deliveryImageTooLargeMessage(),
            code: "DELIVERY_FILE_TOO_LARGE",
          },
          { status: 400 },
        );
      }

      let buffer: Buffer;
      try {
        buffer = Buffer.from(await file.arrayBuffer());
      } catch {
        return NextResponse.json(
          {
            error: "Dosya okunamadi veya aktarim yarıda kaldi. Tekrar deneyin.",
            code: "DELIVERY_UPLOAD_INTERRUPTED",
          },
          { status: 400 },
        );
      }

      if (buffer.length > earlyMax) {
        return NextResponse.json(
          {
            error: likelyVideo ? deliveryVideoTooLargeMessage() : deliveryImageTooLargeMessage(),
            code: "DELIVERY_FILE_TOO_LARGE",
          },
          { status: 400 },
        );
      }

      const validated = validateCollaborationMediaBuffer(buffer);
      if (validated.ok === false) {
        return NextResponse.json(
          { error: validated.error, code: "DELIVERY_FILE_UNSUPPORTED" },
          { status: 400 },
        );
      }

      const maxForKind = maxBytesForDeliveryMedia(validated.media);
      if (buffer.length > maxForKind) {
        return NextResponse.json(
          {
            error:
              validated.media.kind === "IMAGE"
                ? deliveryImageTooLargeMessage()
                : deliveryVideoTooLargeMessage(),
            code: "DELIVERY_FILE_TOO_LARGE",
          },
          { status: 400 },
        );
      }

      work.push({
        buffer,
        validated: validated.media,
        originalFilenameSafe: sanitizeOriginalFilename(file.name),
      });
    }

    const prepared: PreparedFile[] = [];
    for (const w of work) {
      let saved: { storedFilename: string };
      try {
        saved = await saveDeliveryMediaFile(w.buffer, w.validated);
      } catch {
        for (const name of writtenPaths) {
          try {
            await unlink(deliveryMediaAbsolutePath(name));
          } catch {
            /* ignore */
          }
        }
        return NextResponse.json(
          {
            error: "Dosya diske yazilamadi. Tekrar deneyin veya daha kucuk bir dosya deneyin.",
            code: "DELIVERY_PROCESS_FAILED",
          },
          { status: 500 },
        );
      }
      writtenPaths.push(saved.storedFilename);
      prepared.push({
        kind: prismaKindFromValidated(w.validated),
        mime: w.validated.mime,
        storedFilename: saved.storedFilename,
        sizeBytes: w.buffer.length,
        originalFilenameSafe: w.originalFilenameSafe,
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
    return NextResponse.json(
      {
        error: "Sunucuda islem tamamlanamadi. Lutfen tekrar deneyin.",
        code: "DELIVERY_PROCESS_FAILED",
      },
      { status: 500 },
    );
  }
}
