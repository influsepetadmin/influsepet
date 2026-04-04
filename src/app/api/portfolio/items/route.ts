import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { parseOptionalHttpHttpsUrl } from "@/lib/safeUrl";

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { influencer: true },
  });
  if (!user?.influencer) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const platform = String(body?.platform ?? "OTHER").toUpperCase();
  const urlRaw = String(body?.url ?? "").trim();
  const title = String(body?.title ?? "").trim() || null;

  if (!urlRaw) {
    return NextResponse.json({ error: "URL gerekli." }, { status: 400 });
  }

  const urlCheck = parseOptionalHttpHttpsUrl(urlRaw);
  if (urlCheck.ok === false) {
    return NextResponse.json({ error: urlCheck.error }, { status: 400 });
  }
  if (!urlCheck.value) {
    return NextResponse.json({ error: "Gecersiz URL." }, { status: 400 });
  }
  const url = urlCheck.value;

  const p = platform === "INSTAGRAM" || platform === "TIKTOK" ? platform : "OTHER";

  const item = await prisma.influencerPortfolioItem.create({
    data: {
      influencerProfileId: user.influencer.id,
      platform: p as "INSTAGRAM" | "TIKTOK" | "OTHER",
      title,
      url,
    },
    select: { id: true, platform: true, title: true, url: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, item });
}
