-- Migrate OfferStatus: replace PAID with extended workflow; map legacy PAID rows to COMPLETED.
CREATE TYPE "OfferStatus_new" AS ENUM (
  'PENDING',
  'ACCEPTED',
  'REJECTED',
  'CANCELLED',
  'IN_PROGRESS',
  'DELIVERED',
  'REVISION_REQUESTED',
  'COMPLETED',
  'DISPUTED'
);

ALTER TABLE "Offer" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Offer" ALTER COLUMN "status" TYPE "OfferStatus_new" USING (
  CASE
    WHEN "status"::text = 'PAID' THEN 'COMPLETED'::"OfferStatus_new"
    ELSE "status"::text::"OfferStatus_new"
  END
);
ALTER TABLE "Offer" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"OfferStatus_new";

DROP TYPE "OfferStatus";
ALTER TYPE "OfferStatus_new" RENAME TO "OfferStatus";
ALTER TABLE "Offer" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"OfferStatus";

ALTER TABLE "Offer" ADD COLUMN "campaignName" TEXT,
ADD COLUMN "deliverableType" TEXT,
ADD COLUMN "deliverableCount" INTEGER,
ADD COLUMN "budgetTRY" INTEGER,
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "revisionCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "usageRights" TEXT,
ADD COLUMN "notes" TEXT;
