-- Backward-compatible storage provider metadata for delivery proof media.
-- Existing rows remain LOCAL and continue to use storedFilename.
CREATE TYPE "MediaStorageProvider" AS ENUM ('LOCAL', 'R2');

ALTER TABLE "OfferDeliveryMedia"
ADD COLUMN "storageProvider" "MediaStorageProvider" NOT NULL DEFAULT 'LOCAL',
ADD COLUMN "objectKey" TEXT;

CREATE INDEX "OfferDeliveryMedia_storageProvider_idx" ON "OfferDeliveryMedia"("storageProvider");
