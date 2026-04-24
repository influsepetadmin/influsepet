"use client";

import { useEffect, useState } from "react";

export type ProfileCtaAbVariant = "A" | "B";

/** Konsol / devtools ile silinerek yeniden atanabilir. */
export const PROFILE_CTA_AB_STORAGE_KEY = "influsepet_profile_cta_ab" as const;

/**
 * Track / tıklama anında — `useProfileCtaAbVariant` ile aynı localStorage anahtarı.
 * Hook henüz güncellenmeden önceki tıklamalarda da doğru varyantı verir.
 */
export function getProfileCtaAbVariantForTrack(): ProfileCtaAbVariant {
  return readOrAssignProfileCtaAbVariant();
}

/** Tarayıcıda kalıcı A/B; yoksa %50 atama. SSR / depolama hatasında "A". */
export function readOrAssignProfileCtaAbVariant(): ProfileCtaAbVariant {
  if (typeof window === "undefined") return "A";
  try {
    const raw = localStorage.getItem(PROFILE_CTA_AB_STORAGE_KEY);
    if (raw === "A" || raw === "B") return raw;
    const next: ProfileCtaAbVariant = Math.random() < 0.5 ? "A" : "B";
    localStorage.setItem(PROFILE_CTA_AB_STORAGE_KEY, next);
    return next;
  } catch {
    return "A";
  }
}

/**
 * İlk render "A" (SSR ile uyum); mount sonrası gerçek varyant.
 * Profil CTA düzeni ve track alanları için kullanılır.
 */
export function useProfileCtaAbVariant(): ProfileCtaAbVariant {
  const [v, setV] = useState<ProfileCtaAbVariant>("A");
  useEffect(() => {
    queueMicrotask(() => {
      setV(readOrAssignProfileCtaAbVariant());
    });
  }, []);
  return v;
}
