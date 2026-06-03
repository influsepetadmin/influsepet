CREATE TYPE "SocialAccountVerificationStatus" AS ENUM ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED');

ALTER TABLE "SocialAccount"
ADD COLUMN "verificationStatus" "SocialAccountVerificationStatus" NOT NULL DEFAULT 'UNVERIFIED',
ADD COLUMN "verificationRequestedAt" TIMESTAMP(3),
ADD COLUMN "verificationReviewedAt" TIMESTAMP(3),
ADD COLUMN "verificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "verificationReviewerNote" TEXT;

UPDATE "SocialAccount"
SET "verificationStatus" = CASE
  WHEN "isVerified" = true THEN 'VERIFIED'::"SocialAccountVerificationStatus"
  ELSE 'UNVERIFIED'::"SocialAccountVerificationStatus"
END;

CREATE INDEX "SocialAccount_verificationStatus_idx" ON "SocialAccount"("verificationStatus");
