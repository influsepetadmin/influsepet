-- CreateEnum
CREATE TYPE "PortfolioPlatform" AS ENUM ('INSTAGRAM', 'TIKTOK', 'OTHER');

-- CreateTable
CREATE TABLE "InfluencerPortfolioItem" (
    "id" TEXT NOT NULL,
    "influencerProfileId" TEXT NOT NULL,
    "platform" "PortfolioPlatform" NOT NULL,
    "title" TEXT,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InfluencerPortfolioItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InfluencerPortfolioItem" ADD CONSTRAINT "InfluencerPortfolioItem_influencerProfileId_fkey" FOREIGN KEY ("influencerProfileId") REFERENCES "InfluencerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
