-- RenameForeignKey
ALTER TABLE "Review" RENAME CONSTRAINT "Review_authorId_fkey" TO "Review_reviewerUserId_fkey";

-- RenameForeignKey
ALTER TABLE "Review" RENAME CONSTRAINT "Review_targetId_fkey" TO "Review_revieweeUserId_fkey";
