import type { ComponentType, SVGProps } from "react";
import {
  PublicProfileIconBanknote,
  PublicProfileIconBriefcase,
  PublicProfileIconListBullet,
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
  Takipçi: "◎",
  "Baz fiyat": "₺",
};

/** İnce çizgi ikonlar — yalnızca influencer public profilinde `iconTreatment="line"` ile. */
const STAT_LINE: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  "Tamamlanan iş birliği": PublicProfileIconBriefcase,
  "Ortalama puan": PublicProfileIconStar,
  "Puanlama sayısı": PublicProfileIconListBullet,
  Takipçi: PublicProfileIconUsers,
  "Baz fiyat": PublicProfileIconBanknote,
};

export function PublicProfileStatCards({
  items,
  iconTreatment = "line",
}: {
  items: PublicProfileStatItem[];
  iconTreatment?: "emoji" | "line";
}) {
  return (
    <div className="public-profile-stats" data-stat-count={items.length} role="list">
      {items.map((item) => {
        const LineIcon = STAT_LINE[item.label];
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
