import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { normalizeBrandUsername, validateBrandUsernameNormalized } from "@/lib/brandUsername";
import { parseOptionalProfileImageUrl, parseOptionalWebsiteUrl } from "@/lib/safeUrl";

const BIO_MAX = 2000;

function getRequestOrigin(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {}
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
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
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent(websiteCheck.error), origin));
  }
  const profileImageCheck = parseOptionalProfileImageUrl(String(form.get("profileImageUrl") ?? "").trim() || null);
  if (profileImageCheck.ok === false) {
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent(profileImageCheck.error), origin));
  }
  const website = websiteCheck.value;
  const profileImageUrl = profileImageCheck.value;

  if (!companyName) {
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent("Sirket adi gerekli"), origin));
  }

  const usernameNorm = normalizeBrandUsername(usernameRaw);
  const userNameCheck = validateBrandUsernameNormalized(usernameNorm);
  if (userNameCheck.ok === false) {
    return NextResponse.redirect(new URL("/marka?err=" + encodeURIComponent(userNameCheck.message), origin));
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
        new URL("/marka?err=" + encodeURIComponent("Bu kullanici adi baska bir marka tarafindan kullaniliyor."), origin),
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
      new URL("/marka?err=" + encodeURIComponent("Profil kaydedilemedi. Tekrar deneyin."), origin),
    );
  }

  return NextResponse.redirect(new URL("/marka", origin));
}
