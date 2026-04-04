import { prisma } from "@/lib/prisma";

export async function getConversationWithOffer(conversationId: string) {
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      offer: { select: { id: true, brandId: true, influencerId: true } },
    },
  });
}

export function isConversationParticipant(
  offer: { brandId: string; influencerId: string },
  userId: string,
): boolean {
  return offer.brandId === userId || offer.influencerId === userId;
}
