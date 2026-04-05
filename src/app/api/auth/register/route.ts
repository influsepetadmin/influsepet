import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/session";

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

function redirectErr(origin: string, form: FormData, message: string, role: string) {
  const returnRaw = String(form.get("authReturn") ?? "").trim();
  const basePath = returnRaw === "/giris" ? "/giris" : "/";
  const u = new URL(basePath, origin);
  u.searchParams.set("err", message);
  u.searchParams.set("role", role === "BRAND" ? "BRAND" : "INFLUENCER");
  u.searchParams.set("mode", "register");
  return NextResponse.redirect(u);
}

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const roleRaw = String(form.get("role") ?? "").toUpperCase();
  const role = roleRaw === "BRAND" ? "BRAND" : "INFLUENCER";

  if (!name || !email || password.length < 6) {
    return redirectErr(origin, form, "Eksik veya gecersiz alanlar.", role);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return redirectErr(origin, form, "Bu e-posta ile kayit var.", role);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    if (role === "BRAND") {
      const companyName = String(form.get("companyName") ?? "").trim();
      if (!companyName) return redirectErr(origin, form, "Marka adi gerekli.", role);

      const user = await prisma.user.create({
        data: {
          name,
          email,
          role: "BRAND",
          passwordHash,
          brand: {
            create: {
              companyName,
            },
          },
        },
      });
      await setSessionCookie(user.id);
      return NextResponse.redirect(new URL("/marka", origin));
    }

    const username = String(form.get("username") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) {
      return redirectErr(origin, form, "Kullanici adi en az 3 karakter olmali.", role);
    }

    const taken = await prisma.influencerProfile.findUnique({ where: { username } });
    if (taken) {
      return redirectErr(origin, form, "Bu kullanici adi alinmis.", role);
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "INFLUENCER",
        passwordHash,
        influencer: {
          create: {
            username,
            category: "yasam_tarzi",
            followerCount: 0,
            basePriceTRY: 0,
          },
        },
      },
    });
    await setSessionCookie(user.id);
    return NextResponse.redirect(new URL("/influencer", origin));
  } catch (e) {
    console.error(e);
    return redirectErr(origin, form, "Kayit sirasinda hata olustu.", role);
  }
}
