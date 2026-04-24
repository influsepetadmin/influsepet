"use client";

import type { FormHTMLAttributes, ReactNode } from "react";
import { trackFirstTimeOnce, trackProductEvent } from "@/lib/productTracking/productEvents";

type CardKind = "influencer_card" | "brand_card";

export function TrackedOfferCreateForm({
  children,
  cardKind,
  ...formProps
}: Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  children: ReactNode;
  cardKind: CardKind;
}) {
  return (
    <form
      {...formProps}
      onSubmit={() => {
        trackProductEvent({
          event: "collaboration_form_submit_intent",
          location: "discover",
          label: cardKind,
        });
        trackFirstTimeOnce(`influsepet_ft_collab_submit_intent_${cardKind}`, {
          event: "first_collaboration_submit_intent",
          location: "discover",
          label: cardKind,
        });
      }}
    >
      {children}
    </form>
  );
}
