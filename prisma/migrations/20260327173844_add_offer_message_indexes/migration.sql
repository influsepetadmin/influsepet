-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Offer_brandId_influencerId_idx" ON "Offer"("brandId", "influencerId");
