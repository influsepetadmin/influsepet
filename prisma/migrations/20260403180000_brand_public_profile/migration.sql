-- AlterTable
ALTER TABLE "BrandProfile" ADD COLUMN "username" TEXT;
ALTER TABLE "BrandProfile" ADD COLUMN "bio" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "BrandProfile_username_key" ON "BrandProfile"("username");

-- CreateTable
CREATE TABLE "BrandSelectedCategory" (
    "id" TEXT NOT NULL,
    "brandProfileId" TEXT NOT NULL,
    "categoryKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandSelectedCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BrandSelectedCategory_brandProfileId_categoryKey_key" ON "BrandSelectedCategory"("brandProfileId", "categoryKey");

-- CreateIndex
CREATE INDEX "BrandSelectedCategory_brandProfileId_idx" ON "BrandSelectedCategory"("brandProfileId");

-- AddForeignKey
ALTER TABLE "BrandSelectedCategory" ADD CONSTRAINT "BrandSelectedCategory_brandProfileId_fkey" FOREIGN KEY ("brandProfileId") REFERENCES "BrandProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
