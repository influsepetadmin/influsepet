import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { normalizeBrandUsername } from "@/lib/brandUsername";
import { sameOriginRedirect } from "@/lib/sameOriginRedirect";
import { setSessionCookie } from "@/lib/session";

const userLoginSelect = {
  id: true,
  email: true,
  role: true,
  passwordHash: true,
} as const;

/** @ içeriyorsa e-posta; aksi halde seçilen role göre influencer / marka kullanıcı adı. */
async function findUserForLogin(rawIdentifier: string, roleHint: "BRAND" | "INFLUENCER") {
  const trimmed = rawIdentifier.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    return prisma.user.findUnique({
      where: { email },
      select: userLoginSelect,
    });
  }

  if (roleHint === "INFLUENCER") {
    const username = trimmed.toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (username.length < 1) return null;
    const profile = await prisma.influencerProfile.findUnique({
      where: { username },
      select: { userId: true },
    });
    if (!profile) return null;
    return prisma.user.findUnique({
      where: { id: profile.userId },
      select: userLoginSelect,
    });
  }

  const username = normalizeBrandUsername(trimmed);
  if (!username) return null;
  const profile = await prisma.brandProfile.findUnique({
    where: { username },
    select: { userId: true },
  });
  if (!profile) return null;
  return prisma.user.findUnique({
    where: { id: profile.userId },
    select: userLoginSelect,
  });
}

/** Tarayıcıda bu URL açılırsa (GET) form yok; ana sayfadaki girişe yönlendir. */
export async function GET(request: Request) {
  return sameOriginRedirect("/?mode=login");
}

export async function POST(request: Request) {
  const form = await request.formData();
  const identifierRaw = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");

  const errUrl = (msg: string) => {
    const returnRaw = String(form.get("authReturn") ?? "").trim();
    const basePath = returnRaw === "/giris" ? "/giris" : "/";
    const sp = new URLSearchParams();
    sp.set("err", msg);
    sp.set("mode", "login");
    const hint = String(form.get("roleHint") ?? "").toUpperCase();
    if (hint === "BRAND" || hint === "INFLUENCER") {
      sp.set("role", hint);
    }
    return sameOriginRedirect(`${basePath}?${sp.toString()}`);
  };

  const roleHint = String(form.get("roleHint") ?? "").toUpperCase();
  const roleHintOk = roleHint === "BRAND" || roleHint === "INFLUENCER";

  if (!identifierRaw.trim() || !password) {
    return errUrl("E-posta veya kullanici adi ve sifre gerekli.");
  }

  if (!roleHintOk) {
    return errUrl("Giris icin influencer veya marka rolunu secin.");
  }

  const user = await findUserForLogin(identifierRaw, roleHint);
  if (!user || !user.passwordHash) {
    return errUrl("E-posta veya kullanici adi veya sifre hatali.");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return errUrl("E-posta veya kullanici adi veya sifre hatali.");

  if (user.role === "ADMIN") {
    await setSessionCookie(user.id);
    return sameOriginRedirect("/");
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
    return sameOriginRedirect("/marka/overview");
  }
  if (user.role === "INFLUENCER") {
    return sameOriginRedirect("/influencer/overview");
  }
  return sameOriginRedirect("/");
}
