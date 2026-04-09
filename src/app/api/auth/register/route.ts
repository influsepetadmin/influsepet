import bcrypt from "bcryptjs";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/passwordConstants";
import { prisma } from "@/lib/prisma";
import { sameOriginRedirect } from "@/lib/sameOriginRedirect";
import { setSessionCookie } from "@/lib/session";

function redirectErr(request: Request, form: FormData, message: string, role: string) {
  const returnRaw = String(form.get("authReturn") ?? "").trim();
  const basePath = returnRaw === "/giris" ? "/giris" : "/";
  const sp = new URLSearchParams();
  sp.set("err", message);
  sp.set("role", role === "BRAND" ? "BRAND" : "INFLUENCER");
  sp.set("mode", "register");
  return sameOriginRedirect(request, `${basePath}?${sp.toString()}`);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const name = String(form.get("name") ?? "").trim();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const confirmPassword = String(form.get("confirmPassword") ?? "");
  const roleRaw = String(form.get("role") ?? "").toUpperCase();
  const role = roleRaw === "BRAND" ? "BRAND" : "INFLUENCER";

  if (password !== confirmPassword) {
    return redirectErr(request, form, "Şifreler eşleşmiyor.", role);
  }

  if (!name || !email || password.length < MIN_PASSWORD_LENGTH) {
    return redirectErr(request, form, "Eksik veya gecersiz alanlar.", role);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return redirectErr(request, form, "Bu e-posta ile kayit var.", role);
  }

  const passwordHash = await bcrypt.hash(password, 10);

  try {
    if (role === "BRAND") {
      const companyName = String(form.get("companyName") ?? "").trim();
      if (!companyName) return redirectErr(request, form, "Marka adi gerekli.", role);

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
      return sameOriginRedirect(request, "/marka");
    }

    const username = String(form.get("username") ?? "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "");
    if (username.length < 3) {
      return redirectErr(request, form, "Kullanici adi en az 3 karakter olmali.", role);
    }

    const taken = await prisma.influencerProfile.findUnique({ where: { username } });
    if (taken) {
      return redirectErr(request, form, "Bu kullanici adi alinmis.", role);
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
    return sameOriginRedirect(request, "/influencer");
  } catch (e) {
    console.error(e);
    return redirectErr(request, form, "Kayit sirasinda hata olustu.", role);
  }
}
