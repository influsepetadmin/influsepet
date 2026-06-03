import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { generateVerificationCode } from "@/lib/socialAccounts";

const VERIFICATION_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const socialAccountSelect = {
  id: true,
  platform: true,
  username: true,
  profileUrl: true,
  isConnected: true,
  isVerified: true,
  verificationStatus: true,
  verificationMethod: true,
  verificationCode: true,
  verificationRequestedAt: true,
  verificationReviewedAt: true,
  verificationExpiresAt: true,
  verificationReviewerNote: true,
  verifiedAt: true,
} as const;

function serializeSocialAccount<T extends { verifiedAt: Date | null; verificationRequestedAt: Date | null; verificationReviewedAt: Date | null; verificationExpiresAt: Date | null }>(
  account: T,
) {
  return {
    ...account,
    verifiedAt: account.verifiedAt?.toISOString() ?? null,
    verificationRequestedAt: account.verificationRequestedAt?.toISOString() ?? null,
    verificationReviewedAt: account.verificationReviewedAt?.toISOString() ?? null,
    verificationExpiresAt: account.verificationExpiresAt?.toISOString() ?? null,
  };
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const socialAccountId = typeof body?.socialAccountId === "string" ? body.socialAccountId.trim() : "";
  const intent = typeof body?.intent === "string" ? body.intent : "submit";

  if (!socialAccountId) {
    return NextResponse.json({ error: "socialAccountId gerekli." }, { status: 400 });
  }

  const account = await prisma.socialAccount.findFirst({
    where: { id: socialAccountId, userId: session.uid },
    select: socialAccountSelect,
  });

  if (!account) {
    return NextResponse.json({ error: "Hesap bulunamadi." }, { status: 404 });
  }

  if (intent === "generate") {
    const updated = await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        isVerified: false,
        verifiedAt: null,
        verificationStatus: "UNVERIFIED",
        verificationMethod: "BIO_CODE",
        verificationCode: generateVerificationCode(),
        verificationRequestedAt: null,
        verificationReviewedAt: null,
        verificationExpiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
        verificationReviewerNote: null,
      },
      select: socialAccountSelect,
    });

    return NextResponse.json({ ok: true, socialAccount: serializeSocialAccount(updated) });
  }

  if (intent !== "submit") {
    return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
  }

  if (account.isVerified || account.verificationStatus === "VERIFIED") {
    return NextResponse.json({ ok: true, socialAccount: serializeSocialAccount(account) });
  }

  if (!account.verificationCode) {
    return NextResponse.json(
      { error: "Doğrulama kodunun süresi doldu. Yeni bir kod oluşturabilirsiniz." },
      { status: 400 },
    );
  }

  if (account.verificationExpiresAt && account.verificationExpiresAt.getTime() < Date.now()) {
    const updated = await prisma.socialAccount.update({
      where: { id: account.id },
      data: { verificationStatus: "EXPIRED" },
      select: socialAccountSelect,
    });

    return NextResponse.json(
      {
        error: "Doğrulama kodunun süresi doldu. Yeni bir kod oluşturabilirsiniz.",
        socialAccount: serializeSocialAccount(updated),
      },
      { status: 400 },
    );
  }

  const updated = await prisma.socialAccount.update({
    where: { id: account.id },
    data: {
      verificationStatus: "PENDING",
      verificationMethod: "BIO_CODE",
      verificationRequestedAt: new Date(),
      verificationReviewedAt: null,
      verificationReviewerNote: null,
    },
    select: socialAccountSelect,
  });

  return NextResponse.json({ ok: true, socialAccount: serializeSocialAccount(updated) });
}
