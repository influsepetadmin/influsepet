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

/** Tarayıcıda bu URL açılırsa (GET) form yok; ana sayfadaki girişe yönlendir. */
export async function GET(request: Request) {
  const origin = getRequestOrigin(request);
  const u = new URL("/", origin);
  u.searchParams.set("mode", "login");
  return NextResponse.redirect(u);
}

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  const form = await request.formData();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  const errUrl = (msg: string) => {
    const returnRaw = String(form.get("authReturn") ?? "").trim();
    const basePath = returnRaw === "/giris" ? "/giris" : "/";
    const x = new URL(basePath, origin);
    x.searchParams.set("err", msg);
    x.searchParams.set("mode", "login");
    const hint = String(form.get("roleHint") ?? "").toUpperCase();
    if (hint === "BRAND" || hint === "INFLUENCER") {
      x.searchParams.set("role", hint);
    }
    return NextResponse.redirect(x);
  };

  if (!email || !password) return errUrl("E-posta ve sifre gerekli.");

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash) return errUrl("E-posta veya sifre hatali.");

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return errUrl("E-posta veya sifre hatali.");

  const roleHint = String(form.get("roleHint") ?? "").toUpperCase();
  if (roleHint !== "BRAND" && roleHint !== "INFLUENCER") {
    return errUrl("Giris icin influencer veya marka rolunu secin.");
  }

  if (user.role === "ADMIN") {
    await setSessionCookie(user.id);
    return NextResponse.redirect(new URL("/", origin));
  }

  if (user.role !== roleHint) {
    if (user.role === "INFLUENCER") {
      return errUrl("Böyle bir marka hesabı bulunamadı.");
    }
    if (user.role === "BRAND") {
      return errUrl("Böyle bir influencer hesabı bulunamadı.");
    }
    return errUrl("Bu hesap secilen rol ile eslesmiyor.");
  }

  await setSessionCookie(user.id);

  if (user.role === "BRAND") {
    return NextResponse.redirect(new URL("/marka", origin));
  }
  if (user.role === "INFLUENCER") {
    return NextResponse.redirect(new URL("/influencer", origin));
  }
  return NextResponse.redirect(new URL("/", origin));
}
