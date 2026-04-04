-- CreateEnum
CREATE TYPE "ReviewDirection" AS ENUM ('BRAND_TO_INFLUENCER', 'INFLUENCER_TO_BRAND');

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "targetId" TEXT NOT NULL,
    "direction" "ReviewDirection" NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_targetId_createdAt_idx" ON "Review"("targetId", "createdAt");

-- CreateIndex
CREATE INDEX "Review_authorId_createdAt_idx" ON "Review"("authorId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_offerId_direction_key" ON "Review"("offerId", "direction");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
