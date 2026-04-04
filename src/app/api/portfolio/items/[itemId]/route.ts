import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const { itemId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { influencer: true },
  });
  if (!user?.influencer) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const item = await prisma.influencerPortfolioItem.findUnique({
    where: { id: itemId },
  });
  if (!item || item.influencerProfileId !== user.influencer.id) {
    return NextResponse.json({ error: "Bulunamadi." }, { status: 404 });
  }

  await prisma.influencerPortfolioItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
