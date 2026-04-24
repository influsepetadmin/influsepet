"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getProfileCtaAbVariantForTrack } from "@/lib/productTracking/profileCtaAb";
import { trackProductEvent } from "@/lib/productTracking/productEvents";

const PUBLIC_PROFILE_AB_LOCATIONS = new Set(["public_profile_influencer", "public_profile_brand"]);

/** Sohbete git / chat href — public profil veya kart aksiyonları. */
export function TrackedChatOpenLink({
  href,
  className,
  location,
  label = "chat_cta",
  children,
}: {
  href: string;
  className?: string;
  location: string;
  label?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackProductEvent({
          event: "chat_open",
          location,
          label,
          href,
          ...(PUBLIC_PROFILE_AB_LOCATIONS.has(location)
            ? { variant: getProfileCtaAbVariantForTrack() }
            : {}),
        })
      }
    >
      {children}
    </Link>
  );
}
