import { NextResponse } from "next/server";
import type { SocialAccountVerificationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

function isReviewStatus(value: unknown): value is Extract<SocialAccountVerificationStatus, "VERIFIED" | "REJECTED" | "EXPIRED"> {
  return value === "VERIFIED" || value === "REJECTED" || value === "EXPIRED";
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum bulunamadi." }, { status: 401 });
  }

  const reviewer = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { role: true },
  });

  if (reviewer?.role !== "ADMIN") {
    return NextResponse.json({ error: "Yetki yok." }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const socialAccountId = typeof body?.socialAccountId === "string" ? body.socialAccountId.trim() : "";
  const status = body?.status;
  const reviewerNote =
    typeof body?.reviewerNote === "string" && body.reviewerNote.trim()
      ? body.reviewerNote.trim().slice(0, 500)
      : null;

  if (!socialAccountId || !isReviewStatus(status)) {
    return NextResponse.json({ error: "socialAccountId ve gecerli status gerekli." }, { status: 400 });
  }

  const now = new Date();
  const updated = await prisma.socialAccount.update({
    where: { id: socialAccountId },
    data:
      status === "VERIFIED"
        ? {
            isVerified: true,
            verifiedAt: now,
            verificationStatus: "VERIFIED",
            verificationMethod: "BIO_CODE",
            verificationCode: null,
            verificationReviewedAt: now,
            verificationReviewerNote: reviewerNote,
          }
        : {
            isVerified: false,
            verifiedAt: null,
            verificationStatus: status,
            verificationReviewedAt: now,
            verificationReviewerNote: reviewerNote,
          },
    select: {
      id: true,
      platform: true,
      username: true,
      isVerified: true,
      verificationStatus: true,
      verificationReviewedAt: true,
      verifiedAt: true,
    },
  });

  return NextResponse.json({
    ok: true,
    socialAccount: {
      ...updated,
      verificationReviewedAt: updated.verificationReviewedAt?.toISOString() ?? null,
      verifiedAt: updated.verifiedAt?.toISOString() ?? null,
    },
  });
}
