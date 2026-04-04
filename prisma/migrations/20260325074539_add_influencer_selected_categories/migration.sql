-- CreateTable
CREATE TABLE "InfluencerSelectedCategory" (
    "id" TEXT NOT NULL,
    "influencerProfileId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerSelectedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerSelectedCategory_influencerProfileId_categoryKey_key" ON "InfluencerSelectedCategory"("influencerProfileId", "categoryKey");

-- AddForeignKey
ALTER TABLE "InfluencerSelectedCategory" ADD CONSTRAINT "InfluencerSelectedCategory_influencerProfileId_fkey" FOREIGN KEY ("influencerProfileId") REFERENCES "InfluencerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
