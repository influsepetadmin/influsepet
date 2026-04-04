-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('SUBMITTED', 'APPROVED', 'REVISION_REQUESTED');

-- CreateTable
CREATE TABLE "OfferDelivery" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "deliveryUrl" TEXT,
    "deliveryText" TEXT,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'SUBMITTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OfferDelivery_offerId_createdAt_idx" ON "OfferDelivery"("offerId", "createdAt");

-- AddForeignKey
ALTER TABLE "OfferDelivery" ADD CONSTRAINT "OfferDelivery_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferDelivery" ADD CONSTRAINT "OfferDelivery_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
