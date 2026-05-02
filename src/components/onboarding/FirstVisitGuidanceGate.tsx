"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

const ONBOARDING_DISMISSED_KEY = "influsepet_onboarding_guidance_dismissed_v1";

type GuidanceScope = "discover" | "profile" | "chat";

type GuidanceCopy = {
  scope: GuidanceScope;
  text: string;
};

function copyForScope(scope: GuidanceScope): GuidanceCopy {
  switch (scope) {
    case "discover":
      return {
        scope,
        text: "Arama ve filtrelerle doğru profilleri bulun; uygun karttan iş birliği başlatın.",
      };
    case "profile":
      return {
        scope,
        text: "Teklif göndermeden önce profil özeti, puan ve doğrulama bilgilerini kontrol edin.",
      };
    case "chat":
      return {
        scope,
        text: "Teklif, teslimat ve puanlama adımlarını bu çalışma alanından takip edin.",
      };
  }
}

function getGuidanceCopy(pathname: string, scope?: GuidanceScope): GuidanceCopy | null {
  if (scope) return copyForScope(scope);

  if (pathname.includes("/discover")) {
    return copyForScope("discover");
  }

  if (
    pathname.includes("/profil/") ||
    pathname.startsWith("/u/") ||
    pathname.startsWith("/brand/")
  ) {
    return copyForScope("profile");
  }

  if (/(^|\/)chat(\/|$)/.test(pathname)) {
    return copyForScope("chat");
  }

  return null;
}

export function FirstVisitGuidanceGate({
  scope,
  className = "",
}: {
  scope?: GuidanceScope;
  className?: string;
}) {
  const pathname = usePathname();
  const copy = useMemo(() => getGuidanceCopy(pathname, scope), [pathname, scope]);
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
    <aside
      className={`first-visit-guidance first-visit-guidance--${copy.scope}${className ? ` ${className}` : ""}`}
      role="status"
      aria-live="polite"
    >
      <p className="first-visit-guidance__eyebrow">Hızlı başlangıç</p>
      <p className="first-visit-guidance__text">{copy.text}</p>
      <button type="button" className="first-visit-guidance__close" onClick={onDismiss}>
        Kapat
      </button>
    </aside>
  );
}
