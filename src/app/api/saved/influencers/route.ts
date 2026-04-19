import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

type Body = { influencerUserId?: string };

async function requireBrand(sessionUid: string) {
  const user = await prisma.user.findUnique({
    where: { id: sessionUid },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "BRAND") return null;
  return user;
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) return NextResponse.json({ error: "Oturum yok." }, { status: 401 });

  const me = await requireBrand(session.uid);
  if (!me) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  const influencerUserId = String(body.influencerUserId ?? "").trim();
  if (!influencerUserId) {
    return NextResponse.json({ error: "influencerUserId gerekli." }, { status: 400 });
  }
  if (influencerUserId === me.id) {
    return NextResponse.json({ error: "Geçersiz hedef." }, { status: 400 });
  }

  const inf = await prisma.user.findUnique({
    where: { id: influencerUserId },
    select: { id: true, role: true, influencer: { select: { id: true } } },
  });
  if (!inf?.influencer || inf.role !== "INFLUENCER") {
    return NextResponse.json({ error: "İçerik üreticisi bulunamadı." }, { status: 404 });
  }

  try {
    await prisma.brandSavedInfluencer.create({
      data: { brandUserId: me.id, influencerUserId },
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

  const me = await requireBrand(session.uid);
  if (!me) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });

  const url = new URL(request.url);
  const fromQuery = url.searchParams.get("influencerUserId")?.trim() ?? "";

  let influencerUserId = fromQuery;
  if (!influencerUserId) {
    try {
      const body = (await request.json()) as Body;
      influencerUserId = String(body.influencerUserId ?? "").trim();
    } catch {
      /* query-only */
    }
  }

  if (!influencerUserId) {
    return NextResponse.json({ error: "influencerUserId gerekli." }, { status: 400 });
  }

  await prisma.brandSavedInfluencer.deleteMany({
    where: { brandUserId: me.id, influencerUserId },
  });

  return NextResponse.json({ ok: true, saved: false });
}
