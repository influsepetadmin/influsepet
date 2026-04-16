import type { SVGProps } from "react";
import {
  PublicProfileIconBuildingOffice2,
  PublicProfileIconChatBubbleLeftRight,
  PublicProfileIconDevicePhoneMobile,
  PublicProfileIconExclamationTriangle,
  PublicProfileIconInbox,
  PublicProfileIconListBullet,
  PublicProfileIconLockClosed,
  PublicProfileIconMagnifyingGlass,
  PublicProfileIconMapPin,
  PublicProfileIconPaperAirplane,
  PublicProfileIconPhoto,
} from "@/components/profile/public/publicProfileInfluencerIcons";

const GLYPH = "empty-state-card__glyph-svg";

function big(props: SVGProps<SVGSVGElement>) {
  return { width: 28, height: 28, className: GLYPH, ...props } as SVGProps<SVGSVGElement>;
}

export function EmptyGlyphChatBubble(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconChatBubbleLeftRight {...big(p)} />;
}

export function EmptyGlyphLockClosed(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconLockClosed {...big(p)} />;
}

export function EmptyGlyphMagnifyingGlass(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconMagnifyingGlass {...big(p)} />;
}

export function EmptyGlyphInbox(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconInbox {...big(p)} />;
}

export function EmptyGlyphPaperAirplane(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconPaperAirplane {...big(p)} />;
}

export function EmptyGlyphBuildingOffice(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconBuildingOffice2 {...big(p)} />;
}

export function EmptyGlyphMapPin(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconMapPin {...big(p)} />;
}

export function EmptyGlyphExclamationTriangle(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconExclamationTriangle {...big(p)} />;
}

export function EmptyGlyphPhoto(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconPhoto {...big(p)} />;
}

export function EmptyGlyphDevicePhone(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconDevicePhoneMobile {...big(p)} />;
}

/** Değerlendirme / liste boş */
export function EmptyGlyphListBullet(p: SVGProps<SVGSVGElement>) {
  return <PublicProfileIconListBullet {...big(p)} />;
}
