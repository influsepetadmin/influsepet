import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

const mineSelect = {
  id: true,
  platform: true,
  username: true,
  profileUrl: true,
  displayName: true,
  avatarUrl: true,
  followerCount: true,
  isConnected: true,
  isVerified: true,
  verificationStatus: true,
  verificationMethod: true,
  verifiedAt: true,
  verificationCode: true,
  verificationRequestedAt: true,
  verificationReviewedAt: true,
  verificationExpiresAt: true,
  verificationReviewerNote: true,
} as const;

export async function GET() {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  await prisma.socialAccount.updateMany({
    where: {
      userId: session.uid,
      isVerified: false,
      verificationStatus: "UNVERIFIED",
      verificationExpiresAt: { lt: new Date() },
    },
    data: { verificationStatus: "EXPIRED" },
  });

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.uid },
    orderBy: [{ platform: "asc" }, { username: "asc" }],
    select: mineSelect,
  });

  const socialAccounts = accounts.map((a) => ({
    ...a,
    verifiedAt: a.verifiedAt?.toISOString() ?? null,
    verificationRequestedAt: a.verificationRequestedAt?.toISOString() ?? null,
    verificationReviewedAt: a.verificationReviewedAt?.toISOString() ?? null,
    verificationExpiresAt: a.verificationExpiresAt?.toISOString() ?? null,
    verificationCode: a.isVerified || a.verificationStatus === "EXPIRED" ? null : a.verificationCode,
  }));

  return NextResponse.json({ ok: true, socialAccounts });
}
