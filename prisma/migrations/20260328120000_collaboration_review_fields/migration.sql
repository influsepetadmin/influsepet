-- Collaboration reviews: drop direction enum, rename to reviewer/reviewee, isPublic, new uniqueness

DROP INDEX IF EXISTS "Review_offerId_direction_key";

ALTER TABLE "Review" DROP COLUMN IF EXISTS "direction";

DROP TYPE IF EXISTS "ReviewDirection";

ALTER TABLE "Review" RENAME COLUMN "authorId" TO "reviewerUserId";
ALTER TABLE "Review" RENAME COLUMN "targetId" TO "revieweeUserId";
ALTER TABLE "Review" RENAME COLUMN "isVisible" TO "isPublic";

DROP INDEX IF EXISTS "Review_authorId_createdAt_idx";
DROP INDEX IF EXISTS "Review_targetId_createdAt_idx";

CREATE UNIQUE INDEX "Review_offerId_reviewerUserId_key" ON "Review"("offerId", "reviewerUserId");

CREATE INDEX "Review_offerId_idx" ON "Review"("offerId");
CREATE INDEX "Review_revieweeUserId_createdAt_idx" ON "Review"("revieweeUserId", "createdAt");
CREATE INDEX "Review_reviewerUserId_idx" ON "Review"("reviewerUserId");
