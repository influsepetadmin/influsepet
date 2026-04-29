"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const ONBOARDING_DISMISSED_KEY = "influsepet_onboarding_guidance_dismissed_v1";

type GuidanceCopy = {
  scope: "discover" | "profile" | "chat";
  text: string;
};

function getGuidanceCopy(pathname: string): GuidanceCopy | null {
  if (pathname.includes("/discover")) {
    return {
      scope: "discover",
      text: "İçerik üreticileri keşfet, profillere gir ve iş birliği başlat.",
    };
  }

  if (
    pathname.includes("/profil/") ||
    pathname.startsWith("/u/") ||
    pathname.startsWith("/brand/")
  ) {
    return {
      scope: "profile",
      text: "Bu profil ile iş birliği başlatmak için teklif gönder.",
    };
  }

  if (/(^|\/)chat(\/|$)/.test(pathname)) {
    return {
      scope: "chat",
      text: "Buradan iletişimi yönetebilir ve teslim sürecini takip edebilirsin.",
    };
  }

  return null;
}

export function FirstVisitGuidanceGate() {
  const pathname = usePathname();
  const copy = useMemo(() => getGuidanceCopy(pathname), [pathname]);
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(ONBOARDING_DISMISSED_KEY) === "1");
    } catch {
      setDismissed(true);
    } finally {
      setReady(true);
    }
  }, []);

  function onDismiss() {
    try {
      localStorage.setItem(ONBOARDING_DISMISSED_KEY, "1");
    } catch {
      // localStorage yazilamasa bile UI kapansin
    }
    setDismissed(true);
  }

  if (!ready || dismissed || !copy) return null;

  return (
    <aside className="first-visit-guidance" role="status" aria-live="polite">
      <p className="first-visit-guidance__eyebrow">Hızlı başlangıç</p>
      <p className="first-visit-guidance__text">{copy.text}</p>
      <button type="button" className="first-visit-guidance__close" onClick={onDismiss}>
        Kapat
      </button>
    </aside>
  );
}
