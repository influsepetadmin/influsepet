import { NextResponse } from "next/server";
import { SocialPlatform } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import {
  buildProfileUrl,
  generateVerificationCode,
  parseUsernameOrUrl,
} from "@/lib/socialAccounts";

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
  verificationCode: true,
} as const;

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

  const parsed = parseUsernameOrUrl(platform, usernameOrUrl);
  if (parsed.ok === false) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const username = parsed.username;
  const profileUrl = buildProfileUrl(platform, username);
  const code = generateVerificationCode();

  const existing = await prisma.socialAccount.findUnique({
    where: {
      platform_username: { platform, username },
    },
  });

  if (existing && existing.userId !== session.uid) {
    return NextResponse.json(
      { error: "Bu hesap baska bir kullaniciya bagli." },
      { status: 409 },
    );
  }

  try {
    const row = existing
      ? await prisma.socialAccount.update({
          where: { id: existing.id },
          data: {
            profileUrl,
            isConnected: true,
            isVerified: false,
            verificationMethod: null,
            verificationCode: code,
            verifiedAt: null,
            lastSyncedAt: null,
          },
          select: connectSelect,
        })
      : await prisma.socialAccount.create({
          data: {
            userId: session.uid,
            platform,
            username,
            profileUrl,
            isConnected: true,
            isVerified: false,
            verificationCode: code,
          },
          select: connectSelect,
        });

    return NextResponse.json({ ok: true, socialAccount: row });
  } catch {
    return NextResponse.json({ error: "Kayit olusturulamadi." }, { status: 500 });
  }
}
