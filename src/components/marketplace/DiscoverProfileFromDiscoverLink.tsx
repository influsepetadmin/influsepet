"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getProfileCtaAbVariantForTrack } from "@/lib/productTracking/profileCtaAb";
import { trackFirstTimeOnce, trackProductEvent } from "@/lib/productTracking/productEvents";

function withDiscoverSource(href: string): string {
  const [baseWithQuery, hash = ""] = href.split("#");
  const [basePath, query = ""] = baseWithQuery.split("?");
  const params = new URLSearchParams(query);
  if (!params.has("from")) params.set("from", "discover");
  const next = `${basePath}?${params.toString()}`;
  return hash ? `${next}#${hash}` : next;
}

export function DiscoverProfileFromDiscoverLink({
  href,
  className,
  profileRole,
  targetUserId,
  children,
}: {
  href: string;
  className?: string;
  profileRole: "influencer" | "brand";
  targetUserId: string;
  children: ReactNode;
}) {
  const discoverHref = withDiscoverSource(href);
  return (
    <Link
      href={discoverHref}
      className={className}
      onClick={() => {
        trackProductEvent({
          event: "profile_cta_click",
          location: "discover",
          label: `profile_${profileRole}`,
          targetUserId,
          variant: getProfileCtaAbVariantForTrack(),
        });
        trackFirstTimeOnce(`influsepet_ft_profile_from_discover_${profileRole}`, {
          event: "first_profile_visit_from_discover",
          location: "discover",
          label: `profile_${profileRole}`,
          targetUserId,
        });
      }}
    >
      {children}
    </Link>
  );
}
