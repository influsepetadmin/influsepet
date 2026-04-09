import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generatePasswordResetSecret, PASSWORD_RESET_TTL_MS } from "@/lib/auth/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email/sendPasswordReset";
import { getSiteOrigin } from "@/lib/siteUrl";

const GENERIC_JSON = {
  ok: true as const,
  message:
    "E-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı kısa süre içinde gönderilir. Gelen kutunuzu ve spam klasörünü kontrol edin.",
};

function isValidEmailShape(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}

export async function POST(request: Request) {
  let email = "";
  try {
    const body = (await request.json().catch(() => null)) as { email?: unknown } | null;
    email = String(body?.email ?? "").trim().toLowerCase();
  } catch {
    return NextResponse.json(GENERIC_JSON);
  }

  if (!email || !isValidEmailShape(email)) {
    return NextResponse.json(GENERIC_JSON);
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, passwordHash: true },
  });

  if (!user?.passwordHash) {
    return NextResponse.json(GENERIC_JSON);
  }

  const { rawToken, tokenHash } = generatePasswordResetSecret();
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const origin = getSiteOrigin();
  const resetUrl = `${origin}/sifre-sifirla?token=${encodeURIComponent(rawToken)}`;

  await sendPasswordResetEmail({ to: email, resetUrl });

  return NextResponse.json(GENERIC_JSON);
}
