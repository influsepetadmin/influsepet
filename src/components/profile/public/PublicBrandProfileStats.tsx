import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { PublicProfileStatCards } from "./PublicProfileStatCards";

export function PublicBrandProfileStats({ data }: { data: PublicBrandProfileResponse }) {
  const items: { label: string; value: string }[] = [
    { label: "Tamamlanan iş birliği", value: String(data.completedCollaborationsCount) },
    {
      label: "Ortalama puan",
      value: data.averageRating != null ? data.averageRating.toFixed(1) : "—",
    },
    { label: "Puanlama sayısı", value: String(data.ratingCount) },
  ];

  return <PublicProfileStatCards items={items} />;
}
