-- Varsayılan komisyon oranı %15 → %8,5 (yalnızca yeni satırlar için; mevcut Offer satırları değişmez).
ALTER TABLE "Offer" ALTER COLUMN "commissionRate" SET DEFAULT 0.085;
