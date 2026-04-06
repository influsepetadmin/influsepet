/**
 * Platform komisyon oranı — tek kaynak (ör. teklif oluşturma, seed, gösterim).
 * İş kuralı: komisyon = teklif tutarı × oran (TRY aşağı yuvarlanır); net = tutar − komisyon.
 */
export const PLATFORM_COMMISSION_RATE = 0.085 as const;

export function commissionTRYFromOfferAmount(offerAmountTRY: number): number {
  return Math.floor(offerAmountTRY * PLATFORM_COMMISSION_RATE);
}

export function netPayoutTRYFromOfferAmount(offerAmountTRY: number): number {
  return offerAmountTRY - commissionTRYFromOfferAmount(offerAmountTRY);
}

/** Kart / özet: DB’deki oranı (örn. 0.085) Türkçe yüzde metnine çevirir. */
export function formatCommissionPercentTr(rate: number): string {
  const pct = Math.round(rate * 1000) / 10;
  return pct.toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  });
}
