-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "isDelivered" BOOLEAN NOT NULL DEFAULT false;
