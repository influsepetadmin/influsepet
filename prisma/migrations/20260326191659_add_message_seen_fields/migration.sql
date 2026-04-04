-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "isSeen" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "seenAt" TIMESTAMP(3);
