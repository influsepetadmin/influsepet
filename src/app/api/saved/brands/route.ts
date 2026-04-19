import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

type Body = { brandUserId?: string };

async function requireInfluencer(sessionUid: string) {
  const user = await prisma.user.findUnique({
    where: { id: sessionUid },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "INFLUENCER") return null;
  return user;
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Oturum yok." }, { status: 401 });

  const me = await requireInfluencer(session.uid);
  if (!me) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const brandUserId = String(body.brandUserId ?? "").trim();
  if (!brandUserId) {
    return NextResponse.json({ error: "brandUserId gerekli." }, { status: 400 });
  }
  if (brandUserId === me.id) {
    return NextResponse.json({ error: "Geçersiz hedef." }, { status: 400 });
  }

  const brand = await prisma.user.findUnique({
    where: { id: brandUserId },
    select: { id: true, role: true, brand: { select: { id: true } } },
  });
  if (!brand?.brand || brand.role !== "BRAND") {
    return NextResponse.json({ error: "Marka bulunamadı." }, { status: 404 });
  }

  try {
    await prisma.influencerSavedBrand.create({
      data: { influencerUserId: me.id, brandUserId },
    });
    return NextResponse.json({ ok: true, saved: true });
  } catch (e: unknown) {
    const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
    if (code === "P2002") {
      return NextResponse.json({ ok: true, saved: true, duplicate: true });
    }
    throw e;
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Oturum yok." }, { status: 401 });

  const me = await requireInfluencer(session.uid);
  if (!me) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const url = new URL(request.url);
  const brandUserId = url.searchParams.get("brandUserId")?.trim() ?? "";

  let resolvedBrandUserId = brandUserId;
  if (!resolvedBrandUserId) {
    try {
      const body = (await request.json()) as Body;
      resolvedBrandUserId = String(body.brandUserId ?? "").trim();
    } catch {
      /* query-only delete */
    }
  }

  if (!resolvedBrandUserId) {
    return NextResponse.json({ error: "brandUserId gerekli." }, { status: 400 });
  }

  await prisma.influencerSavedBrand.deleteMany({
    where: { influencerUserId: me.id, brandUserId: resolvedBrandUserId },
  });

  return NextResponse.json({ ok: true, saved: false });
}
