-- Influencer → saved brand profiles (by brand account user id)
CREATE TABLE "InfluencerSavedBrand" (
    "id" TEXT NOT NULL,
    "influencerUserId" TEXT NOT NULL,
    "brandUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerSavedBrand_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InfluencerSavedBrand_influencerUserId_brandUserId_key" ON "InfluencerSavedBrand"("influencerUserId", "brandUserId");
CREATE INDEX "InfluencerSavedBrand_influencerUserId_createdAt_idx" ON "InfluencerSavedBrand"("influencerUserId", "createdAt");

ALTER TABLE "InfluencerSavedBrand" ADD CONSTRAINT "InfluencerSavedBrand_influencerUserId_fkey" FOREIGN KEY ("influencerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InfluencerSavedBrand" ADD CONSTRAINT "InfluencerSavedBrand_brandUserId_fkey" FOREIGN KEY ("brandUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Brand → saved influencer profiles (by influencer account user id)
CREATE TABLE "BrandSavedInfluencer" (
    "id" TEXT NOT NULL,
    "brandUserId" TEXT NOT NULL,
    "influencerUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandSavedInfluencer_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "BrandSavedInfluencer_brandUserId_influencerUserId_key" ON "BrandSavedInfluencer"("brandUserId", "influencerUserId");
CREATE INDEX "BrandSavedInfluencer_brandUserId_createdAt_idx" ON "BrandSavedInfluencer"("brandUserId", "createdAt");

ALTER TABLE "BrandSavedInfluencer" ADD CONSTRAINT "BrandSavedInfluencer_brandUserId_fkey" FOREIGN KEY ("brandUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BrandSavedInfluencer" ADD CONSTRAINT "BrandSavedInfluencer_influencerUserId_fkey" FOREIGN KEY ("influencerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
