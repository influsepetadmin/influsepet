import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { canTransitionOffer, type OfferForTransition } from "@/lib/offers/transitions";
import { sameOriginRedirect } from "@/lib/sameOriginRedirect";
import { getSessionPayload } from "@/lib/session";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  const wantsRedirect = !contentType.includes("application/json");
  const redirectWithErr = (path: string, message: string) => {
    const sp = new URLSearchParams();
    sp.set("err", message);
    sp.set("mode", "login");
    return sameOriginRedirect(`${path}?${sp.toString()}`);
  };

  const session = await getSessionPayload();
  if (!session) {
    if (wantsRedirect) return redirectWithErr("/", "Oturum bulunamadi.");
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });

  if (!user) return NextResponse.json({ error: "Kullanici bulunamadi." }, { status: 404 });

  let offerId = "";
  let action = "";
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as Record<string, unknown>;
    offerId = String(body?.offerId ?? "").trim();
    action = String(body?.action ?? "").trim().toUpperCase();
  } else {
    const form = await request.formData();
    offerId = String(form.get("offerId") ?? "").trim();
    action = String(form.get("action") ?? "").trim().toUpperCase();
  }

  if (!offerId || (action !== "ACCEPT" && action !== "REJECT")) {
    if (wantsRedirect) return redirectWithErr("/influencer", "Eksik veya hatali parametre.");
    return NextResponse.json({ error: "Eksik veya hatali parametre." }, { status: 400 });
  }

  const nextStatus = action === "ACCEPT" ? ("ACCEPTED" as const) : ("REJECTED" as const);

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    select: { id: true, influencerId: true, brandId: true, initiatedBy: true, status: true },
  });

  if (!offer) {
    if (wantsRedirect) return redirectWithErr("/influencer", "Teklif bulunamadi.");
    return NextResponse.json({ error: "Teklif bulunamadi." }, { status: 404 });
  }

  const okPath = offer.initiatedBy === "BRAND" ? "/influencer" : "/marka";

  if (offer.initiatedBy === "BRAND") {
    if (user.role !== "INFLUENCER" || offer.influencerId !== user.id) {
      if (wantsRedirect) return redirectWithErr("/influencer", "Yetkisiz.");
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
  } else {
    if (user.role !== "BRAND" || offer.brandId !== user.id) {
      if (wantsRedirect) return redirectWithErr("/marka", "Yetkisiz.");
      return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
    }
  }

  const forTransition: OfferForTransition = {
    id: offer.id,
    status: offer.status,
    brandId: offer.brandId,
    influencerId: offer.influencerId,
    initiatedBy: offer.initiatedBy,
  };

  const check = canTransitionOffer({
    offer: forTransition,
    sessionUser: { id: user.id, role: user.role },
    nextStatus,
  });

  if (check.ok === false) {
    const status = check.code === "FORBIDDEN" ? 403 : 400;
    if (wantsRedirect) return redirectWithErr(okPath, check.message);
    return NextResponse.json({ error: check.message, code: check.code }, { status });
  }

  await prisma.offer.update({
    where: { id: offerId },
    data: { status: nextStatus },
  });

  if (wantsRedirect) return sameOriginRedirect(okPath);
  return NextResponse.json({ ok: true, status: nextStatus });
}
