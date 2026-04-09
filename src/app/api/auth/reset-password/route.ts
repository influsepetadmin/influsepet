import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { MIN_PASSWORD_LENGTH } from "@/lib/auth/passwordConstants";
import { hashPasswordResetToken } from "@/lib/auth/passwordReset";

export async function POST(request: Request) {
  let tokenRaw = "";
  let password = "";
  try {
    const body = (await request.json().catch(() => null)) as { token?: unknown; password?: unknown } | null;
    tokenRaw = String(body?.token ?? "").trim();
    password = String(body?.password ?? "");
  } catch {
    return NextResponse.json({ error: "Geçersiz istek." }, { status: 400 });
  }

  if (!tokenRaw) {
    return NextResponse.json({ error: "Bağlantı geçersiz." }, { status: 400 });
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return NextResponse.json(
      { error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır.` },
      { status: 400 },
    );
  }

  const tokenHash = hashPasswordResetToken(tokenRaw);

  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });

  if (!row || row.usedAt != null || row.expiresAt < new Date()) {
    return NextResponse.json(
      { error: "Bağlantı geçersiz veya süresi dolmuş. Yeni bir şifre sıfırlama isteği oluşturun." },
      { status: 400 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: row.userId, usedAt: null, id: { not: row.id } },
    }),
  ]);

  return NextResponse.json({ ok: true as const, message: "Şifreniz güncellendi. Giriş yapabilirsiniz." });
}
