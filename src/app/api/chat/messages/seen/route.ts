import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { getConversationWithOffer, isConversationParticipant } from "@/lib/chat/conversationAccess";

/**
 * Marks all messages in the conversation that were sent by the other participant
 * and not yet seen. Only conversation participants may call this.
 */
export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const conversationId = String(body?.conversationId ?? "").trim();
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

  const now = new Date();
  const result = await prisma.message.updateMany({
    where: {
      conversationId,
      senderId: { not: session.uid },
      isSeen: false,
    },
    data: {
      isSeen: true,
      seenAt: now,
    },
  });

  return NextResponse.json({ ok: true, updated: result.count });
}
