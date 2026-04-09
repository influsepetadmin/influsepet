import { NextResponse } from "next/server";
import crypto from "node:crypto";
import {
  PLATFORM_COMMISSION_RATE,
  commissionTRYFromOfferAmount,
  netPayoutTRYFromOfferAmount,
} from "@/lib/platformCommission";
import { prisma } from "@/lib/prisma";
import { sameOriginRedirect } from "@/lib/sameOriginRedirect";
import { getSessionPayload } from "@/lib/session";

function parseOptionalInt(v: unknown, opts?: { min?: number }): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (opts?.min !== undefined && i < opts.min) return null;
  return i;
}

function parseOptionalNonEmptyString(v: unknown): string | null {
  const s = String(v ?? "").trim();
  return s.length ? s : null;
}

function parseOptionalDate(v: unknown): Date | null {
  if (v === undefined || v === null || v === "") return null;
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return null;
  return d;
}

type ParsedBody = {
  title: string;
  brief: string;
  offerAmountTRY: number;
  brandId: string;
  influencerId: string;
  campaignName: string | null;
  deliverableType: string | null;
  deliverableCount: number | null;
  budgetTRY: number | null;
  dueDate: Date | null;
  revisionCount: number;
  usageRights: string | null;
  notes: string | null;
};

function parseCreatePayload(record: Record<string, unknown>): ParsedBody {
  const titleRaw = parseOptionalNonEmptyString(record.title);
  const campaignNameRaw = parseOptionalNonEmptyString(record.campaignName);
  const resolvedTitle = titleRaw ?? campaignNameRaw ?? "";
  const resolvedCampaignName = campaignNameRaw ?? titleRaw ?? null;

  const brief = String(record.brief ?? "").trim();
  const offerAmt = Number(record.offerAmountTRY ?? record.budgetTRY ?? 0);
  const budgetExplicit = parseOptionalInt(record.budgetTRY, { min: 0 });
  const offerAmountTRY = Number.isFinite(offerAmt) && offerAmt > 0 ? Math.floor(offerAmt) : 0;

  const budgetTRY =
    budgetExplicit !== null && budgetExplicit > 0
      ? budgetExplicit
      : Number.isFinite(offerAmt) && offerAmt > 0
        ? Math.floor(offerAmt)
        : null;

  const revisionCount = parseOptionalInt(record.revisionCount, { min: 0 }) ?? 0;

  return {
    title: resolvedTitle,
    brief,
    offerAmountTRY,
    brandId: String(record.brandId ?? "").trim(),
    influencerId: String(record.influencerId ?? "").trim(),
    campaignName: resolvedCampaignName,
    deliverableType: parseOptionalNonEmptyString(record.deliverableType),
    deliverableCount: parseOptionalInt(record.deliverableCount, { min: 0 }),
    budgetTRY,
    dueDate: parseOptionalDate(record.dueDate),
    revisionCount,
    usageRights: parseOptionalNonEmptyString(record.usageRights),
    notes: parseOptionalNonEmptyString(record.notes),
  };
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  const contentType = request.headers.get("content-type") ?? "";
  const wantsRedirect = !contentType.includes("application/json");

  const redirectWithErr = (path: string, message: string) => {
    const sp = new URLSearchParams();
    sp.set("err", message);
    sp.set("mode", "login");
    return sameOriginRedirect(request, `${path}?${sp.toString()}`);
  };

  if (!session) {
    if (wantsRedirect) return redirectWithErr("/", "Oturum bulunamadi.");
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });

  if (!user || (user.role !== "BRAND" && user.role !== "INFLUENCER")) {
    if (wantsRedirect) return redirectWithErr("/", "Yetkisiz.");
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let record: Record<string, unknown>;
  if (contentType.includes("application/json")) {
    record = ((await request.json().catch(() => null)) as Record<string, unknown>) ?? {};
  } else {
    const form = await request.formData();
    record = Object.fromEntries(form.entries());
  }

  const p = parseCreatePayload(record);

  const commissionRate = PLATFORM_COMMISSION_RATE;
  const commissionTRY = commissionTRYFromOfferAmount(p.offerAmountTRY);
  const netPayoutTRY = netPayoutTRYFromOfferAmount(p.offerAmountTRY);

  const offerDataBase = {
    title: p.title,
    brief: p.brief,
    offerAmountTRY: p.offerAmountTRY,
    commissionRate,
    commissionTRY,
    netPayoutTRY,
    status: "PENDING" as const,
    campaignName: p.campaignName,
    deliverableType: p.deliverableType,
    deliverableCount: p.deliverableCount,
    budgetTRY: p.budgetTRY ?? p.offerAmountTRY,
    dueDate: p.dueDate,
    revisionCount: p.revisionCount,
    usageRights: p.usageRights,
    notes: p.notes,
  };

  try {
    if (user.role === "BRAND") {
      if (
        !p.influencerId ||
        !p.title ||
        !p.brief ||
        !Number.isFinite(p.offerAmountTRY) ||
        p.offerAmountTRY <= 0
      ) {
        if (wantsRedirect) return redirectWithErr("/marka", "Eksik veya hatali alan.");
        return NextResponse.json({ error: "Eksik veya hatali alan." }, { status: 400 });
      }

      if (p.influencerId === user.id) {
        if (wantsRedirect) return redirectWithErr("/marka", "Kendi hesabiniza teklif olusturamazsiniz.");
        return NextResponse.json({ error: "Kendi hesabiniza teklif olusturamazsiniz." }, { status: 400 });
      }

      const targetInfluencer = await prisma.user.findUnique({
        where: { id: p.influencerId },
        select: { id: true, role: true, influencer: { select: { id: true } } },
      });

      if (!targetInfluencer || targetInfluencer.role !== "INFLUENCER" || !targetInfluencer.influencer) {
        if (wantsRedirect) return redirectWithErr("/marka", "Gecersiz influencer hedefi.");
        return NextResponse.json({ error: "Gecersiz influencer hedefi." }, { status: 400 });
      }

      const offer = await prisma.offer.create({
        data: {
          id: crypto.randomUUID(),
          brandId: user.id,
          influencerId: p.influencerId,
          ...offerDataBase,
          initiatedBy: "BRAND",
          conversation: {
            create: {
              id: crypto.randomUUID(),
            },
          },
        },
        include: {
          conversation: true,
        },
      });

      const conversationId = offer.conversation?.id;
      if (wantsRedirect && conversationId) {
        return sameOriginRedirect(request, `/chat/${conversationId}`);
      }

      return NextResponse.json({ ok: true, offerId: offer.id, conversationId });
    }

    if (!p.brandId || !p.title || !p.brief || !Number.isFinite(p.offerAmountTRY) || p.offerAmountTRY <= 0) {
      if (wantsRedirect) return redirectWithErr("/influencer", "Eksik veya hatali alan.");
      return NextResponse.json({ error: "Eksik veya hatali alan." }, { status: 400 });
    }

    const targetBrand = await prisma.user.findUnique({
      where: { id: p.brandId },
      select: { id: true, role: true, brand: { select: { id: true } } },
    });

    if (!targetBrand || targetBrand.role !== "BRAND" || !targetBrand.brand) {
      if (wantsRedirect) return redirectWithErr("/influencer", "Marka bulunamadi.");
      return NextResponse.json({ error: "Marka bulunamadi." }, { status: 400 });
    }

    if (targetBrand.id === user.id) {
      if (wantsRedirect) return redirectWithErr("/influencer", "Gecersiz hedef.");
      return NextResponse.json({ error: "Gecersiz hedef." }, { status: 400 });
    }

    const offer = await prisma.offer.create({
      data: {
        id: crypto.randomUUID(),
        brandId: targetBrand.id,
        influencerId: user.id,
        ...offerDataBase,
        initiatedBy: "INFLUENCER",
        conversation: {
          create: {
            id: crypto.randomUUID(),
          },
        },
      },
      include: {
        conversation: true,
      },
    });

    const conversationId = offer.conversation?.id;
    if (wantsRedirect && conversationId) {
      return sameOriginRedirect(request, `/chat/${conversationId}`);
    }

    return NextResponse.json({ ok: true, offerId: offer.id, conversationId });
  } catch {
    const path = user.role === "BRAND" ? "/marka" : "/influencer";
    if (wantsRedirect) return redirectWithErr(path, "Teklif gonderilirken hata olustu.");
    return NextResponse.json({ error: "Teklif gonderilirken hata olustu." }, { status: 500 });
  }
}
