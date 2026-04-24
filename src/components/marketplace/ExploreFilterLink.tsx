"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { getProfileCtaAbVariantForTrack } from "@/lib/productTracking/profileCtaAb";
import { trackProductEvent } from "@/lib/productTracking/productEvents";

export function ExploreFilterLink({
  href,
  className,
  filterKind,
  value,
  children,
  role,
}: {
  href: string;
  className?: string;
  filterKind: "category" | "city";
  value: string;
  children: ReactNode;
  role?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      role={role as "listitem" | undefined}
      onClick={() =>
        trackProductEvent({
          event: "discover_filter_click",
          location: "discover_explore",
          label: filterKind,
          value,
          variant: getProfileCtaAbVariantForTrack(),
        })
      }
    >
      {children}
    </Link>
  );
}
