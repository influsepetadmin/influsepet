import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { normalizeBrandUsername, validateBrandUsernameNormalized } from "@/lib/brandUsername";
import { parseOptionalProfileImageUrl, parseOptionalWebsiteUrl } from "@/lib/safeUrl";

const BIO_MAX = 2000;

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "BRAND") {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  const form = await request.formData();
  const companyName = String(form.get("companyName") ?? "").trim();
  const city = String(form.get("city") ?? "").trim() || null;
  const usernameRaw = String(form.get("username") ?? "").trim();
  const bioRaw = String(form.get("bio") ?? "").trim();
  const bio = bioRaw.length > BIO_MAX ? bioRaw.slice(0, BIO_MAX) : bioRaw;
  const bioOrNull = bio.length ? bio : null;

  const categoryKeys = form
    .getAll("brandCategoryKeys")
    .map((x) => String(x).trim())
    .filter(Boolean)
    .slice(0, 3);

  const websiteCheck = parseOptionalWebsiteUrl(String(form.get("website") ?? "").trim() || null);
  if (websiteCheck.ok === false) {
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent(websiteCheck.error), request.url));
  }
  const profileImageCheck = parseOptionalProfileImageUrl(String(form.get("profileImageUrl") ?? "").trim() || null);
  if (profileImageCheck.ok === false) {
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent(profileImageCheck.error), request.url));
  }
  const website = websiteCheck.value;
  const profileImageUrl = profileImageCheck.value;

  if (!companyName) {
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent("Sirket adi gerekli"), request.url));
  }

  const usernameNorm = normalizeBrandUsername(usernameRaw);
  const userNameCheck = validateBrandUsernameNormalized(usernameNorm);
  if (userNameCheck.ok === false) {
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent(userNameCheck.message), request.url));
  }

  const usernameOrNull = usernameNorm.length > 0 ? usernameNorm : null;

  if (usernameOrNull) {
    const taken = await prisma.brandProfile.findFirst({
      where: {
        username: usernameOrNull,
        NOT: { userId: user.id },
      },
      select: { id: true },
    });
    if (taken) {
      return NextResponse.redirect(
        new URL("/marka?err=" + encodeURIComponent("Bu kullanici adi baska bir marka tarafindan kullaniliyor."), request.url),
      );
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.brandProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          companyName,
          city,
          website,
          profileImageUrl,
          username: usernameOrNull,
          bio: bioOrNull,
        },
        update: {
          companyName,
          city,
          website,
          profileImageUrl,
          username: usernameOrNull,
          bio: bioOrNull,
        },
        select: { id: true },
      });

      await tx.brandSelectedCategory.deleteMany({ where: { brandProfileId: profile.id } });
      if (categoryKeys.length > 0) {
        await tx.brandSelectedCategory.createMany({
          data: categoryKeys.map((categoryKey) => ({
            brandProfileId: profile.id,
            categoryKey,
          })),
        });
      }
    });
  } catch {
    return NextResponse.redirect(
      new URL("/marka?err=" + encodeURIComponent("Profil kaydedilemedi. Tekrar deneyin."), request.url),
    );
  }

  return NextResponse.redirect(new URL("/marka", request.url));
}
