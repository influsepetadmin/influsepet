"use client";

import { getProfileCtaAbVariantForTrack } from "@/lib/productTracking/profileCtaAb";
import { trackProductEvent } from "@/lib/productTracking/productEvents";

export function TrackedDiscoverSubmitButton({
  location,
  children = "Sonuçları göster",
}: {
  location: "marka_discover" | "influencer_discover";
  children?: string;
}) {
  return (
    <button
      className="btn discovery-search-actions__submit"
      type="submit"
      onClick={() =>
        trackProductEvent({
          event: "discover_search_submit",
          location,
          label: "results_form",
          variant: getProfileCtaAbVariantForTrack(),
        })
      }
    >
      {children}
    </button>
  );
}
