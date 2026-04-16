"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";

/** Dashboard / chat / profile-edit surfaces — no global marketing footer. */
function shouldHideFooter(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname.startsWith("/marka")) return true;
  if (pathname.startsWith("/influencer")) return true;
  if (pathname.startsWith("/chat")) return true;
  if (pathname.startsWith("/profil")) return true;
  return false;
}

export function SiteFooterGate() {
  const pathname = usePathname();
  if (shouldHideFooter(pathname)) return null;
  return <SiteFooter />;
}
