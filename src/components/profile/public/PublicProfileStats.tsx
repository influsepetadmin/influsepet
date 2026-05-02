import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { PublicProfileStatCards } from "./PublicProfileStatCards";

export function PublicProfileStats({ data }: { data: PublicProfileByUsernameResponse }) {
  const items: { label: string; value: string; displayLabel?: string }[] = [
    {
      label: "Tamamlanan iş birliği",
      displayLabel: "Tamamlanan işler",
      value: String(data.completedCollaborationsCount),
    },
    {
      label: "Ortalama puan",
      value: data.averageRating != null ? data.averageRating.toFixed(1) : "—",
    },
    { label: "Puanlama sayısı", displayLabel: "Puan sayısı", value: String(data.ratingCount) },
    {
      label: "Takipçi",
      value: data.followerCount > 0 ? data.followerCount.toLocaleString("tr-TR") : "—",
    },
    {
      label: "Baz fiyat",
      value: data.basePriceTRY > 0 ? `${data.basePriceTRY.toLocaleString("tr-TR")} TRY` : "—",
    },
  ];

  return <PublicProfileStatCards items={items} iconTreatment="line" />;
}
