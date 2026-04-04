-- CreateTable
CREATE TABLE "CollaborationRating" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "raterUserId" TEXT NOT NULL,
    "rateeUserId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborationRating_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CollaborationRating_rating_range_check" CHECK ("rating" >= 1 AND "rating" <= 5),
    CONSTRAINT "CollaborationRating_rater_ne_ratee_check" CHECK ("raterUserId" <> "rateeUserId")
);

-- CreateIndex
CREATE INDEX "CollaborationRating_offerId_idx" ON "CollaborationRating"("offerId");

-- CreateIndex
CREATE INDEX "CollaborationRating_raterUserId_idx" ON "CollaborationRating"("raterUserId");

-- CreateIndex
CREATE INDEX "CollaborationRating_rateeUserId_idx" ON "CollaborationRating"("rateeUserId");

-- CreateIndex
CREATE INDEX "CollaborationRating_rateeUserId_createdAt_idx" ON "CollaborationRating"("rateeUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationRating_offerId_raterUserId_rateeUserId_key" ON "CollaborationRating"("offerId", "raterUserId", "rateeUserId");

-- AddForeignKey
ALTER TABLE "CollaborationRating" ADD CONSTRAINT "CollaborationRating_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationRating" ADD CONSTRAINT "CollaborationRating_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationRating" ADD CONSTRAINT "CollaborationRating_rateeUserId_fkey" FOREIGN KEY ("rateeUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
