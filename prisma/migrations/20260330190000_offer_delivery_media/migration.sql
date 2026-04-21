-- Teslim satırına bağlı kanıt dosyaları (görsel / video).
CREATE TABLE "OfferDeliveryMedia" (
    "id" TEXT NOT NULL,
    "offerDeliveryId" TEXT NOT NULL,
    "kind" "CollaborationMediaKind" NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storedFilename" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "originalFilenameSafe" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferDeliveryMedia_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OfferDeliveryMedia_offerDeliveryId_idx" ON "OfferDeliveryMedia"("offerDeliveryId");

ALTER TABLE "OfferDeliveryMedia" ADD CONSTRAINT "OfferDeliveryMedia_offerDeliveryId_fkey" FOREIGN KEY ("offerDeliveryId") REFERENCES "OfferDelivery"("id") ON DELETE CASCADE ON UPDATE CASCADE;
