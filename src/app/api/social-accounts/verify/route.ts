import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

function safeCodeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const socialAccountId = typeof body?.socialAccountId === "string" ? body.socialAccountId.trim() : "";
  const providedCode =
    typeof body?.providedCode === "string" ? body.providedCode.trim() : "";

  if (!socialAccountId || !providedCode) {
    return NextResponse.json({ error: "socialAccountId ve providedCode gerekli." }, { status: 400 });
  }

  const account = await prisma.socialAccount.findFirst({
    where: { id: socialAccountId, userId: session.uid },
  });

  if (!account) {
    return NextResponse.json({ error: "Hesap bulunamadi." }, { status: 404 });
  }

  const expected = account.verificationCode;
  if (!expected) {
    return NextResponse.json({ error: "Dogrulama kodu tanimli degil." }, { status: 400 });
  }

  if (!safeCodeEqual(providedCode, expected)) {
    return NextResponse.json({ error: "Kod eslesmedi." }, { status: 400 });
  }

  const updated = await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      isVerified: true,
      verifiedAt: new Date(),
      verificationMethod: "MANUAL",
      verificationCode: null,
    },
    select: {
      id: true,
      isVerified: true,
      verifiedAt: true,
      verificationMethod: true,
    },
  });

  return NextResponse.json({
    ok: true,
    socialAccount: {
      ...updated,
      verifiedAt: updated.verifiedAt?.toISOString() ?? null,
    },
  });
}
