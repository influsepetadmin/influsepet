import { prisma } from "@/lib/prisma";

/** İki kullanıcı arasında herhangi bir teklife bağlı en güncel sohbet (birden fazla teklif olabilir). */
export async function findLatestConversationBetweenBrandAndInfluencer(
  brandUserId: string,
  influencerUserId: string,
): Promise<string | null> {
  const row = await prisma.conversation.findFirst({
    where: {
      offer: {
        brandId: brandUserId,
        influencerId: influencerUserId,
      },
    },
    select: { id: true },
    orderBy: { offer: { updatedAt: "desc" } },
  });
  return row?.id ?? null;
}
