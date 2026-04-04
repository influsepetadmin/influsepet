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
  verificationMethod: true,
  verifiedAt: true,
  verificationCode: true,
} as const;

export async function GET() {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const accounts = await prisma.socialAccount.findMany({
    where: { userId: session.uid },
    orderBy: [{ platform: "asc" }, { username: "asc" }],
    select: mineSelect,
  });

  const socialAccounts = accounts.map((a) => ({
    ...a,
    verifiedAt: a.verifiedAt?.toISOString() ?? null,
    verificationCode: a.isVerified ? null : a.verificationCode,
  }));

  return NextResponse.json({ ok: true, socialAccounts });
}
