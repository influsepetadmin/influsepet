import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { BadgeCheck, ListChecks, ShieldCheck, Star } from "lucide-react";
import { PublicProfileStatCards, type PublicProfileStatIconMap } from "./PublicProfileStatCards";

const BRAND_STAT_ICONS: PublicProfileStatIconMap = {
  "Tamamlanan iş birliği": BadgeCheck,
  "Ortalama puan": Star,
  "Puanlama sayısı": ListChecks,
  "Doğrulanmış hesap": ShieldCheck,
};

export function PublicBrandProfileStats({ data }: { data: PublicBrandProfileResponse }) {
  const items: { label: string; value: string }[] = [
    { label: "Tamamlanan iş birliği", value: String(data.completedCollaborationsCount) },
    {
      label: "Ortalama puan",
      value: data.averageRating != null ? data.averageRating.toFixed(1) : "—",
    },
    { label: "Puanlama sayısı", value: String(data.ratingCount) },
  ];

  if (data.verifiedSocialAccounts.length > 0) {
    items.push({
      label: "Doğrulanmış hesap",
      value: String(data.verifiedSocialAccounts.length),
    });
  }

  return <PublicProfileStatCards items={items} iconTreatment="line" lineIcons={BRAND_STAT_ICONS} />;
}
