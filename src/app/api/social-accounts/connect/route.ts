import { NextResponse } from "next/server";
import { SocialPlatform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import {
  canonicalizeSocialAccountInput,
  generateVerificationCode,
} from "@/lib/socialAccounts";

const VERIFICATION_CODE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isSocialPlatform(value: unknown): value is SocialPlatform {
  return typeof value === "string" && Object.values(SocialPlatform).includes(value as SocialPlatform);
}

const connectSelect = {
  id: true,
  platform: true,
  username: true,
  profileUrl: true,
  isConnected: true,
  isVerified: true,
  verificationStatus: true,
  verificationRequestedAt: true,
  verificationReviewedAt: true,
  verificationExpiresAt: true,
  verificationReviewerNote: true,
  verificationCode: true,
} as const;

type ExistingSocialAccount = {
  id: string;
  userId: string;
  username: string;
  profileUrl: string | null;
};

function duplicateResponse(existing: Pick<ExistingSocialAccount, "userId">, userId: string) {
  const error =
    existing.userId === userId
      ? "Bu sosyal hesap zaten profilinize ekli."
      : "Bu sosyal hesap zaten başka bir profile bağlanmış.";
  return NextResponse.json({ error }, { status: 409 });
}

function canonicalHandleForStoredAccount(
  platform: SocialPlatform,
  account: Pick<ExistingSocialAccount, "username" | "profileUrl">,
): string | null {
  for (const candidate of [account.username, account.profileUrl]) {
    if (!candidate) continue;
    const parsed = canonicalizeSocialAccountInput(platform, candidate);
    if (parsed.ok) return parsed.canonicalHandle;
  }
  return null;
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const platformRaw = body?.platform;
  const usernameOrUrl = body?.usernameOrUrl;

  if (!isSocialPlatform(platformRaw)) {
    return NextResponse.json({ error: "Gecerli platform gerekli (INSTAGRAM, TIKTOK, YOUTUBE)." }, { status: 400 });
  }
  const platform = platformRaw;

  if (typeof usernameOrUrl !== "string") {
    return NextResponse.json({ error: "usernameOrUrl gerekli." }, { status: 400 });
  }

  const parsed = canonicalizeSocialAccountInput(platform, usernameOrUrl);
  if (parsed.ok === false) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const username = parsed.canonicalHandle;
  const profileUrl = parsed.normalizedProfileUrl;
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + VERIFICATION_CODE_TTL_MS);

  const exactExisting = await prisma.socialAccount.findUnique({
    where: {
      platform_username: { platform, username },
    },
    select: { id: true, userId: true, username: true, profileUrl: true },
  });

  if (exactExisting) {
    return duplicateResponse(exactExisting, session.uid);
  }

  // Protect against a small candidate set of legacy rows that predates canonical storage.
  const platformAccounts = await prisma.socialAccount.findMany({
    where: {
      platform,
      OR: [
        { username: { contains: username, mode: "insensitive" } },
        { profileUrl: { contains: username, mode: "insensitive" } },
      ],
    },
    select: { id: true, userId: true, username: true, profileUrl: true },
    take: 25,
  });
  const legacyEquivalent = platformAccounts.find(
    (account) => canonicalHandleForStoredAccount(platform, account) === username,
  );
  if (legacyEquivalent) {
    return duplicateResponse(legacyEquivalent, session.uid);
  }

  try {
    const row = await prisma.socialAccount.create({
      data: {
        userId: session.uid,
        platform,
        username,
        profileUrl,
        isConnected: true,
        isVerified: false,
        verificationStatus: "UNVERIFIED",
        verificationMethod: "BIO_CODE",
        verificationCode: code,
        verificationExpiresAt: expiresAt,
      },
      select: connectSelect,
    });

    return NextResponse.json({ ok: true, socialAccount: row });
  } catch {
    // The existing DB unique constraint closes races between concurrent requests.
    try {
      const conflict = await prisma.socialAccount.findUnique({
        where: { platform_username: { platform, username } },
        select: { userId: true },
      });
      if (conflict) return duplicateResponse(conflict, session.uid);
    } catch {
      // Fall through to the existing generic persistence error.
    }
    return NextResponse.json({ error: "Kayit olusturulamadi." }, { status: 500 });
  }
}
