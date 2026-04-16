import type { ComponentType, SVGProps } from "react";
import {
  PublicProfileIconArrowPath,
  PublicProfileIconBanknote,
  PublicProfileIconCalendar,
  PublicProfileIconClock,
  PublicProfileIconDocumentText,
  PublicProfileIconInbox,
  PublicProfileIconPercent,
} from "@/components/profile/public/publicProfileInfluencerIcons";

const GLYPH_CLASS = "collab-meta-chip__glyph";

const BY_KEY: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  offer: PublicProfileIconBanknote,
  commission: PublicProfileIconPercent,
  net: PublicProfileIconBanknote,
  due: PublicProfileIconCalendar,
  deliverable: PublicProfileIconDocumentText,
  rev: PublicProfileIconArrowPath,
  deliveries: PublicProfileIconInbox,
  created: PublicProfileIconCalendar,
  updated: PublicProfileIconClock,
};

export function CollabMetaChipIcon({ chipKey }: { chipKey: string }) {
  const Icon = BY_KEY[chipKey];
  if (!Icon) return null;
  return <Icon className={GLYPH_CLASS} aria-hidden />;
}
