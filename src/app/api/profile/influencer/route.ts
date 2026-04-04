import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { CATEGORY_KEYS } from "@/lib/categories";
import { parseOptionalHttpHttpsUrl, parseOptionalProfileImageUrl } from "@/lib/safeUrl";

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    include: { influencer: true },
  });
  if (!user || user.role !== "INFLUENCER" || !user.influencer) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const form = await request.formData();
  const username = String(form.get("username") ?? "").trim().toLowerCase();
  const followerCount = Math.max(0, Number(form.get("followerCount") ?? 0));
  const basePriceTRY = Math.max(0, Math.floor(Number(form.get("basePriceTRY") ?? 0)));
  const city = String(form.get("city") ?? "").trim() || null;
  const profileImageUrlRaw = String(form.get("profileImageUrl") ?? "").trim() || null;
  const instagramUrlRaw = String(form.get("instagramUrl") ?? "").trim() || null;
  const tiktokUrlRaw = String(form.get("tiktokUrl") ?? "").trim() || null;
  const nicheTextRaw = String(form.get("nicheText") ?? "").trim();
  const nicheText = nicheTextRaw.length > 500 ? nicheTextRaw.slice(0, 500) : nicheTextRaw;
  const nicheTextOrNull = nicheText.length > 0 ? nicheText : null;

  const profileImageUrlCheck = parseOptionalProfileImageUrl(profileImageUrlRaw);
  if (profileImageUrlCheck.ok === false) {
    return NextResponse.redirect(
      new URL("/influencer?err=" + encodeURIComponent(profileImageUrlCheck.error), request.url),
    );
  }
  const instagramCheck = parseOptionalHttpHttpsUrl(instagramUrlRaw);
  if (instagramCheck.ok === false) {
    return NextResponse.redirect(new URL("/influencer?err=" + encodeURIComponent(instagramCheck.error), request.url));
  }
  const tiktokCheck = parseOptionalHttpHttpsUrl(tiktokUrlRaw);
  if (tiktokCheck.ok === false) {
    return NextResponse.redirect(new URL("/influencer?err=" + encodeURIComponent(tiktokCheck.error), request.url));
  }

  const profileImageUrl = profileImageUrlCheck.value;
  const instagramUrl = instagramCheck.value;
  const tiktokUrl = tiktokCheck.value;

  const keysRaw = form.getAll("categoryKeys");
  const categoryKeys = keysRaw
    .map((k) => String(k).trim())
    .filter((k) => CATEGORY_KEYS.includes(k))
    .slice(0, 3);

  const primaryCategory = categoryKeys[0] ?? user.influencer.category;

  if (username.length < 3) {
    return NextResponse.redirect(new URL("/influencer?err=" + encodeURIComponent("Kullanici adi gecersiz"), request.url));
  }

  if (username !== user.influencer.username) {
    const taken = await prisma.influencerProfile.findUnique({ where: { username } });
    if (taken) {
      return NextResponse.redirect(new URL("/influencer?err=" + encodeURIComponent("Kullanici adi alinmis"), request.url));
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.influencerProfile.update({
      where: { id: user.influencer.id },
      data: {
        username,
        followerCount,
        basePriceTRY,
        city,
        profileImageUrl,
        instagramUrl,
        tiktokUrl,
        nicheText: nicheTextOrNull,
        category: primaryCategory,
      },
    });
    await tx.influencerSelectedCategory.deleteMany({
      where: { influencerProfileId: user.influencer.id },
    });
    if (categoryKeys.length > 0) {
      await tx.influencerSelectedCategory.createMany({
        data: categoryKeys.map((categoryKey) => ({
          influencerProfileId: user.influencer.id,
          categoryKey,
        })),
      });
    }
  });

  return NextResponse.redirect(new URL("/influencer", request.url));
}
