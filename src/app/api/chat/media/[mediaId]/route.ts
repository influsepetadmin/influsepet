import { readFile } from "fs/promises";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { isConversationParticipant } from "@/lib/chat/conversationAccess";
import { collabMediaAbsolutePath } from "@/lib/uploads/collabMediaUpload";

type RouteCtx = { params: Promise<{ mediaId: string }> };

export async function GET(_request: Request, ctx: RouteCtx) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const { mediaId } = await ctx.params;
  if (!mediaId?.trim()) {
    return NextResponse.json({ error: "Gecersiz." }, { status: 400 });
  }

  const media = await prisma.collaborationMedia.findUnique({
    where: { id: mediaId },
    include: {
      offer: { select: { brandId: true, influencerId: true } },
    },
  });

  if (!media) {
    return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
  }

  if (!isConversationParticipant(media.offer, session.uid)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let absolute: string;
  try {
    absolute = collabMediaAbsolutePath(media.storedFilename);
  } catch {
    return NextResponse.json({ error: "Gecersiz dosya." }, { status: 500 });
  }

  let buf: Buffer;
  try {
    buf = await readFile(absolute);
  } catch {
    return NextResponse.json({ error: "Dosya okunamadi." }, { status: 500 });
  }

  const downloadName = media.originalFilenameSafe ?? `media-${media.id}`;

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
