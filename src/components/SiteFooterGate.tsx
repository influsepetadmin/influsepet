"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/SiteFooter";

/** Global marketing footer — only on auth entry routes. */
const FOOTER_PATHS = new Set(["/kayit"]);

function normalizedPath(pathname: string): string {
  const t = pathname.trim();
  if (t === "" || t === "/") return "/";
  return t.replace(/\/+$/, "") || "/";
}

function shouldShowFooter(pathname: string | null): boolean {
  if (!pathname) return false;
  return FOOTER_PATHS.has(normalizedPath(pathname));
}

export function SiteFooterGate() {
  const pathname = usePathname();
  if (!shouldShowFooter(pathname)) return null;
  return <SiteFooter />;
}
