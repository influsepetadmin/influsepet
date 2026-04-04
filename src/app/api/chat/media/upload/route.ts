import { unlink } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { getConversationWithOffer, isConversationParticipant } from "@/lib/chat/conversationAccess";
import {
  collabMediaAbsolutePath,
  maxBytesForValidatedMedia,
  prismaKindFromValidated,
  sanitizeOriginalFilename,
  saveCollaborationMediaFile,
  validateCollaborationMediaBuffer,
} from "@/lib/uploads/collabMediaUpload";

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
  }

  const conversationId = String(formData.get("conversationId") ?? "").trim();
  const file = formData.get("file");

  if (!conversationId || !(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Konusma ve dosya gerekli." }, { status: 400 });
  }

  const conv = await getConversationWithOffer(conversationId);
  if (!conv) {
    return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
  }
  if (!isConversationParticipant(conv.offer, session.uid)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const hardMax = Math.max(
    maxBytesForValidatedMedia({ kind: "IMAGE", mime: "image/jpeg", ext: "jpg" }),
    maxBytesForValidatedMedia({ kind: "VIDEO", mime: "video/mp4", ext: "mp4" }),
  );
  if (file.size > hardMax) {
    return NextResponse.json(
      { error: "Dosya cok buyuk. Goruntu en fazla 10 MB, video en fazla 100 MB." },
      { status: 400 },
    );
  }

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

  let storedFilename: string | null = null;
  try {
    const saved = await saveCollaborationMediaFile(buffer, validated.media);
    storedFilename = saved.storedFilename;

    const row = await prisma.$transaction(async (tx) => {
      const msg = await tx.message.create({
        data: {
          conversationId,
          senderId: session.uid,
          body: "",
          kind: "MEDIA",
          isDelivered: true,
          deliveredAt: new Date(),
        },
      });

      const media = await tx.collaborationMedia.create({
        data: {
          offerId: conv.offer.id,
          conversationId,
          uploaderUserId: session.uid,
          messageId: msg.id,
          kind: prismaKindFromValidated(validated.media),
          mimeType: validated.media.mime,
          storedFilename: saved.storedFilename,
          sizeBytes: buffer.length,
          originalFilenameSafe: sanitizeOriginalFilename(file.name),
        },
        select: {
          id: true,
          kind: true,
          mimeType: true,
          sizeBytes: true,
        },
      });

      return { message: msg, media };
    });

    return NextResponse.json({
      ok: true,
      message: { id: row.message.id, createdAt: row.message.createdAt },
      media: {
        ...row.media,
        url: `/api/chat/media/${row.media.id}`,
      },
    });
  } catch {
    if (storedFilename) {
      try {
        await unlink(collabMediaAbsolutePath(storedFilename));
      } catch {
        /* ignore */
      }
    }
    return NextResponse.json({ error: "Kayit basarisiz. Tekrar deneyin." }, { status: 500 });
  }
}
