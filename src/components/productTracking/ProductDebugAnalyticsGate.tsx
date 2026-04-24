"use client";

import { isDebugProductAnalyticsEnabled } from "@/lib/productTracking/debugProductEventStore";
import { ProductDebugAnalyticsPanel } from "@/components/productTracking/ProductDebugAnalyticsPanel";
import { useCallback, useEffect, useState } from "react";

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return el.isContentEditable;
}

/**
 * Geliştirme veya NEXT_PUBLIC_DEBUG_PRODUCT_ANALYTICS=1 iken yüklenir.
 * Panel varsayılan kapalı; ⇧D ile aç/kapa (odak input/textarea iken devre dışı).
 */
export function ProductDebugAnalyticsGate() {
  if (!isDebugProductAnalyticsEnabled()) return null;
  return <ProductDebugAnalyticsHotkeyShell />;
}

function ProductDebugAnalyticsHotkeyShell() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!e.shiftKey) return;
      if (e.key !== "D" && e.key !== "d") return;
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
      setOpen((v) => !v);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const onClose = useCallback(() => setOpen(false), []);

  if (!open) return null;
  return <ProductDebugAnalyticsPanel onClose={onClose} />;
}
