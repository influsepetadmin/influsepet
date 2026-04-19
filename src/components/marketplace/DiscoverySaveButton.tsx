"use client";

import { Bookmark } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Kayıtlı marka / kayıtlı influencer — yer imi stili; optimistik toggle + başarıda router.refresh.
 */
export function DiscoverySaveButton({
  targetUserId,
  variant,
  initialSaved,
}: {
  targetUserId: string;
  variant: "influencer-saves-brand" | "brand-saves-influencer";
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [saved, setSaved] = useState(initialSaved);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  const endpoint =
    variant === "influencer-saves-brand" ? "/api/saved/brands" : "/api/saved/influencers";

  async function toggle() {
    if (pending) return;
    const next = !saved;
    setSaved(next);
    setPending(true);
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
      setPending(false);
    }
  }

  const label = saved ? "Kayıtlı" : "Kaydet";
  const title = saved ? "Kayıtlılardan çıkar" : "Kayıtlı listeye ekle";

  return (
    <button
      type="button"
      className={
        "discovery-save-btn" +
        (saved ? " discovery-save-btn--saved" : "") +
        (pending ? " discovery-save-btn--pending" : "")
      }
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
      <Bookmark
        size={18}
        strokeWidth={1.75}
        aria-hidden
        fill={saved ? "currentColor" : "none"}
      />
      <span className="discovery-save-btn__text">{label}</span>
    </button>
  );
}
