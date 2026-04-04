import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { getConversationWithOffer, isConversationParticipant } from "@/lib/chat/conversationAccess";

export async function GET(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = String(searchParams.get("conversationId") ?? "").trim();
  if (!conversationId) {
    return NextResponse.json({ error: "conversationId gerekli." }, { status: 400 });
  }

  const conv = await getConversationWithOffer(conversationId);

  if (!conv) {
    return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
  }

  if (!isConversationParticipant(conv.offer, session.uid)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: {
      id: true,
      body: true,
      senderId: true,
      createdAt: true,
      kind: true,
      isDelivered: true,
      isSeen: true,
      collaborationMedia: {
        select: {
          id: true,
          kind: true,
          mimeType: true,
          sizeBytes: true,
        },
      },
    },
  });

  return NextResponse.json({
    ok: true,
    messages: messages.map((m) => ({
      id: m.id,
      body: m.body,
      senderId: m.senderId,
      createdAt: m.createdAt,
      kind: m.kind,
      isDelivered: m.isDelivered,
      isSeen: m.isSeen,
      media: m.collaborationMedia
        ? {
            id: m.collaborationMedia.id,
            kind: m.collaborationMedia.kind,
            mimeType: m.collaborationMedia.mimeType,
            sizeBytes: m.collaborationMedia.sizeBytes,
            url: `/api/chat/media/${m.collaborationMedia.id}`,
          }
        : null,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const conversationId = String(body?.conversationId ?? "").trim();
  const text = String(body?.body ?? "").trim();

  if (!conversationId || !text) {
    return NextResponse.json({ error: "Eksik alan." }, { status: 400 });
  }

  const conv = await getConversationWithOffer(conversationId);

  if (!conv) {
    return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
  }

  if (!isConversationParticipant(conv.offer, session.uid)) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const msg = await prisma.message.create({
    data: {
      conversationId,
      senderId: session.uid,
      body: text,
      isDelivered: true,
      deliveredAt: new Date(),
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, message: msg });
}
