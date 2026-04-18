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

/** Muted line for marketplace search hits (score from fuzzy matcher). */
export function searchMatchWhy(score: number): string {
  if (score >= 88) return "Arama ile güçlü eşleşme";
  if (score >= 70) return "Benzer içerik alanı";
  if (score >= 55) return "Yakın yazım veya kısmi eşleşme";
  return "Genişletilmiş arama eşleşmesi";
}
