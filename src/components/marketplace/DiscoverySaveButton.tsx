"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { trackFirstTimeOnce, trackProductEvent } from "@/lib/productTracking/productEvents";

export type DiscoverySaveVariant = "influencer-saves-brand" | "brand-saves-influencer";

export type DiscoverySaveButtonProps = {
  targetUserId: string;
  variant: DiscoverySaveVariant;
  initialSaved: boolean;
};

export function DiscoverySaveButton({ targetUserId, variant, initialSaved }: DiscoverySaveButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const endpoint = variant === "influencer-saves-brand" ? "/api/saved/brands" : "/api/saved/influencers";

  async function toggle() {
    if (busyRef.current) return;
    busyRef.current = true;
    setPending(true);
    const next = !saved;
    setSaved(next);

    try {
      if (next) {
        const body =
          variant === "influencer-saves-brand"
            ? JSON.stringify({ brandUserId: targetUserId })
            : JSON.stringify({ influencerUserId: targetUserId });
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (!res.ok) {
          setSaved(!next);
          return;
        }
        trackProductEvent({
          event: "save_click",
          location: "discover",
          label: variant,
          targetUserId,
        });
        trackFirstTimeOnce(`influsepet_ft_save_${variant}`, {
          event: "first_saved_profile",
          location: "discover",
          label: variant,
        });
      } else {
        const q =
          variant === "influencer-saves-brand"
            ? `brandUserId=${encodeURIComponent(targetUserId)}`
            : `influencerUserId=${encodeURIComponent(targetUserId)}`;
        const res = await fetch(`${endpoint}?${q}`, { method: "DELETE" });
        if (!res.ok) {
          setSaved(!next);
          return;
        }
      }
      router.refresh();
    } finally {
      busyRef.current = false;
      setPending(false);
    }
  }

  const label = saved ? "Kayıtlı" : "Kaydet";
  const title = saved ? "Kayıtlılardan çıkar" : "Kayıtlı listeye ekle";
  const btnClass =
    "discovery-save-btn" +
    (saved ? " discovery-save-btn--saved" : "") +
    (pending ? " discovery-save-btn--pending" : "");

  return (
    <button
      type="button"
      className={btnClass}
      disabled={pending}
      title={title}
      aria-label={title}
      aria-pressed={saved}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle();
      }}
    >
      <Bookmark size={18} strokeWidth={1.75} aria-hidden fill={saved ? "currentColor" : "none"} />
      <span className="discovery-save-btn__text">{label}</span>
    </button>
  );
}
