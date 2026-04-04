-- CreateTable
CREATE TABLE "InfluencerStats" (
    "id" TEXT NOT NULL,
    "influencerProfileId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "followers" INTEGER NOT NULL,
    "avgEngagementRate" DOUBLE PRECISION,
    "avgViews" INTEGER,
    "postsLast30d" INTEGER,
    "capturedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InfluencerStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InfluencerStats_influencerProfileId_capturedAt_idx" ON "InfluencerStats"("influencerProfileId", "capturedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InfluencerStats_influencerProfileId_platform_capturedAt_key" ON "InfluencerStats"("influencerProfileId", "platform", "capturedAt");
