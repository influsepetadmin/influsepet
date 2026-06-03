import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sameOriginRedirect } from "@/lib/sameOriginRedirect";
import { setSessionCookie } from "@/lib/session";

const adminLoginSelect = {
  id: true,
  email: true,
  role: true,
  passwordHash: true,
} as const;

function adminLoginError(message: string) {
  const sp = new URLSearchParams();
  sp.set("err", message);
  return sameOriginRedirect(`/admin/login?${sp.toString()}`);
}

async function findUserForAdminLogin(identifier: string) {
  if (identifier.includes("@")) {
    return prisma.user.findUnique({
      where: { email: identifier },
      select: adminLoginSelect,
    });
  }

  const localPartEmail = `${identifier}@`;
  const candidates = await prisma.user.findMany({
    where: {
      OR: [{ email: identifier }, { email: { startsWith: localPartEmail } }],
    },
    select: adminLoginSelect,
    orderBy: { createdAt: "asc" },
    take: 5,
  });

  return candidates.find((user) => user.email.split("@")[0] === identifier) ?? candidates[0] ?? null;
}

export async function GET() {
  return sameOriginRedirect("/admin/login");
}

export async function POST(request: Request) {
  const form = await request.formData();
  const identifier = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");

  if (!identifier || !password) {
    return adminLoginError("E-posta veya kullanıcı adı ve şifre gerekli.");
  }

  const user = await findUserForAdminLogin(identifier);

  if (!user?.passwordHash) {
    return adminLoginError("Giriş bilgileri hatalı.");
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return adminLoginError("Giriş bilgileri hatalı.");
  }

  if (user.role !== "ADMIN") {
    return adminLoginError("Bu sayfaya yalnızca yönetici hesapları giriş yapabilir.");
  }

  await setSessionCookie(user.id);
  return sameOriginRedirect("/admin/social-verifications");
}
