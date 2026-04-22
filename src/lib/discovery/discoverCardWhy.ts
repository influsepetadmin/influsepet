import type { SectionReason } from "./discoverSections";

/** Short muted line under discover / result cards. */
export function discoverCardWhy(reason: SectionReason): string {
  const m: Record<SectionReason, string> = {
    categories: "Kategorilerinize uygun",
    same_city: "Aynı şehirde",
    new: "Yeni katıldı",
    nearby: "Aynı şehirde",
    featured: "Öne çıkan profil",
    active: "Son dönemde aktif",
  };
  return m[reason];
}

export type MarketplaceSearchMatchMeta = {
  literal: number;
  fuzzy?: number;
  reason?: "literal" | "typo";
};

function literalWhyLines(literal: number): string {
  if (literal >= 95) return "Arama ile çok güçlü eşleşme";
  if (literal >= 88) return "Arama ile güçlü eşleşme";
  if (literal >= 75) return "İsim veya kullanıcı adına yakın eşleşme";
  if (literal >= 65) return "Şehir, kategori veya açıklama eşleşmesi";
  return "Metin filtresine uyan sonuç";
}

/** Marketplace search: literal-first rows vs typo-assisted broad pool. */
export function searchMatchWhy(meta: number | MarketplaceSearchMatchMeta): string {
  if (typeof meta === "number") {
    return literalWhyLines(meta);
  }
  const reason = meta.reason ?? "literal";
  if (reason === "typo") {
    const f = meta.fuzzy ?? 0;
    if (f >= 70) return "Yazıma çok yakın eşleşme (harf düzeltmesi)";
    if (f >= 55) return "Benzer yazımla eşleşme";
    if (f >= 45) return "Yazım toleranslı eşleşme";
    return "Gevşetilmiş yazım eşleşmesi";
  }
  return literalWhyLines(meta.literal);
}
