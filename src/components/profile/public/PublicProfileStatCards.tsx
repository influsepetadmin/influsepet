import type { ElementType, SVGProps } from "react";
import {
  PublicProfileIconBanknote,
  PublicProfileIconBriefcase,
  PublicProfileIconListBullet,
  PublicProfileIconPhoto,
  PublicProfileIconStar,
  PublicProfileIconUsers,
} from "./publicProfileInfluencerIcons";

type PublicProfileStatItem = {
  label: string;
  value: string;
  /** Optional shorter display copy; `label` remains the stable semantic/icon key. */
  displayLabel?: string;
};

const STAT_EMOJI: Record<string, string> = {
  "Tamamlanan iş birliği": "✓",
  "Ortalama puan": "★",
  "Puanlama sayısı": "#",
  "Portföy öğesi": "□",
  Takipçi: "◎",
  "Baz fiyat": "₺",
};

export type PublicProfileStatIconMap = Partial<Record<string, ElementType<SVGProps<SVGSVGElement>>>>;

/** İnce çizgi ikonlar — varsayılan public profil stat ikonları. */
const STAT_LINE: PublicProfileStatIconMap = {
  "Tamamlanan iş birliği": PublicProfileIconBriefcase,
  "Ortalama puan": PublicProfileIconStar,
  "Puanlama sayısı": PublicProfileIconListBullet,
  "Portföy öğesi": PublicProfileIconPhoto,
  Takipçi: PublicProfileIconUsers,
  "Baz fiyat": PublicProfileIconBanknote,
};

export function PublicProfileStatCards({
  items,
  iconTreatment = "line",
  lineIcons,
}: {
  items: PublicProfileStatItem[];
  iconTreatment?: "emoji" | "line";
  lineIcons?: PublicProfileStatIconMap;
}) {
  return (
    <div className="public-profile-stats" data-stat-count={items.length} role="list">
      {items.map((item) => {
        const LineIcon = lineIcons?.[item.label] ?? STAT_LINE[item.label];
        const displayLabel = item.displayLabel ?? item.label;
        return (
          <div key={item.label} className="public-profile-stat-card" role="listitem">
            <span
              className={`public-profile-stat-card__icon${iconTreatment === "line" ? " public-profile-stat-card__icon--line" : ""}`}
              aria-hidden
            >
              {iconTreatment === "line" && LineIcon ? (
                <LineIcon className="public-profile-icon public-profile-icon--stat" />
              ) : (
                STAT_EMOJI[item.label] ?? "·"
              )}
            </span>
            <div className="public-profile-stat-card__body">
              <span className="public-profile-stat-card__label" title={item.label}>
                {displayLabel}
              </span>
              <span className="public-profile-stat-card__value">{item.value}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
