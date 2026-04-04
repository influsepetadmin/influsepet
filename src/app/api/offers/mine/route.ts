import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { getAvailableOfferTransitions, type OfferForTransition } from "@/lib/offers/transitions";

const offerSelect = {
  id: true,
  title: true,
  brief: true,
  offerAmountTRY: true,
  budgetTRY: true,
  campaignName: true,
  deliverableType: true,
  deliverableCount: true,
  dueDate: true,
  revisionCount: true,
  usageRights: true,
  notes: true,
  status: true,
  initiatedBy: true,
  brandId: true,
  influencerId: true,
  createdAt: true,
  conversation: { select: { id: true } },
} as const;

export async function GET() {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });

  const sessionUser = { id: user.id, role: user.role };

  const offersRaw =
    user.role === "BRAND"
      ? await prisma.offer.findMany({
          where: { brandId: user.id },
          orderBy: { createdAt: "desc" },
          select: {
            ...offerSelect,
            influencer: {
              select: {
                id: true,
                name: true,
                influencer: { select: { username: true } },
              },
            },
          },
        })
      : await prisma.offer.findMany({
          where: { influencerId: user.id },
          orderBy: { createdAt: "desc" },
          select: {
            ...offerSelect,
            brand: {
              select: {
                id: true,
                name: true,
                brand: { select: { companyName: true } },
              },
            },
          },
        });

  const offers = offersRaw.map((row) => {
    const forT: OfferForTransition = {
      id: row.id,
      status: row.status,
      brandId: row.brandId,
      influencerId: row.influencerId,
      initiatedBy: row.initiatedBy,
    };
    const availableNextTransitions = getAvailableOfferTransitions({
      offer: forT,
      sessionUser,
    });
    return { ...row, availableNextTransitions };
  });

  return NextResponse.json({ ok: true, offers });
}
