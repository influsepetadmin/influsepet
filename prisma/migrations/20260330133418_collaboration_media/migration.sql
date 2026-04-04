-- CreateEnum
CREATE TYPE "MessageKind" AS ENUM ('TEXT', 'MEDIA');

-- CreateEnum
CREATE TYPE "CollaborationMediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "kind" "MessageKind" NOT NULL DEFAULT 'TEXT',
ALTER COLUMN "body" SET DEFAULT '';

-- CreateTable
CREATE TABLE "CollaborationMedia" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "uploaderUserId" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "kind" "CollaborationMediaKind" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "originalFilenameSafe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CollaborationMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CollaborationMedia_messageId_key" ON "CollaborationMedia"("messageId");

-- CreateIndex
CREATE INDEX "CollaborationMedia_conversationId_idx" ON "CollaborationMedia"("conversationId");

-- CreateIndex
CREATE INDEX "CollaborationMedia_offerId_idx" ON "CollaborationMedia"("offerId");

-- AddForeignKey
ALTER TABLE "CollaborationMedia" ADD CONSTRAINT "CollaborationMedia_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMedia" ADD CONSTRAINT "CollaborationMedia_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMedia" ADD CONSTRAINT "CollaborationMedia_uploaderUserId_fkey" FOREIGN KEY ("uploaderUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborationMedia" ADD CONSTRAINT "CollaborationMedia_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message"("id") ON DELETE CASCADE ON UPDATE CASCADE;
