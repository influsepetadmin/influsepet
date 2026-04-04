-- CreateEnum
CREATE TYPE "OfferInitiator" AS ENUM ('BRAND', 'INFLUENCER');

-- AlterTable
ALTER TABLE "Offer" ADD COLUMN     "initiatedBy" "OfferInitiator" NOT NULL DEFAULT 'BRAND';
