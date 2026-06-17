import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { BadgeCheck, ReceiptTurkishLira, Star, UsersRound } from "lucide-react";
import { PublicProfileStatCards, type PublicProfileStatIconMap } from "./PublicProfileStatCards";
import { PublicProfileIconPhoto } from "./publicProfileInfluencerIcons";

const INFLUENCER_STAT_ICONS: PublicProfileStatIconMap = {
  "Tamamlanan iş birliği": BadgeCheck,
  "Ortalama puan": Star,
  "Portföy öğesi": PublicProfileIconPhoto,
  Takipçi: UsersRound,
  "Baz fiyat": ReceiptTurkishLira,
};

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
    { label: "Portföy öğesi", value: String(data.portfolioItems.length) },
    {
      label: "Takipçi",
      value: data.followerCount > 0 ? data.followerCount.toLocaleString("tr-TR") : "—",
    },
    {
      label: "Baz fiyat",
      value: data.basePriceTRY > 0 ? `${data.basePriceTRY.toLocaleString("tr-TR")} TRY` : "—",
    },
  ];

  return <PublicProfileStatCards items={items} iconTreatment="line" lineIcons={INFLUENCER_STAT_ICONS} />;
}
