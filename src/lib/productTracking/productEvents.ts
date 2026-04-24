/**
 * Hafif ürün etkileşim günlüğü — harici analitik yok; tarayıcı konsolu veya sunucu konsolu.
 * Senkron ağır iş yok: microtask ile konsola yazılır.
 * Debug panel (geliştirme / NEXT_PUBLIC_DEBUG_PRODUCT_ANALYTICS) için bellek deposuna da eklenir.
 */

import { pushDebugProductEvent } from "@/lib/productTracking/debugProductEventStore";

export type ProductTrackPayload = {
  event: string;
  location?: string;
  label?: string;
  /** Ek alanlar (ör. conversationId, variant) */
  [key: string]: unknown;
};

const PREFIX = "[influsepet:track]";

function emitLine(payload: ProductTrackPayload & { ts: number; scope?: "client" | "server" }) {
  const { ts, scope = "client", ...rest } = payload;
  console.info(PREFIX, { ts, scope, ...rest });
}

/**
 * İstemci bileşenlerinden çağrılır. SSR sırasında no-op.
 */
export function trackProductEvent(payload: ProductTrackPayload): void {
  if (typeof window === "undefined") return;
  queueMicrotask(() => {
    const ts = Date.now();
    const full = { ts, scope: "client" as const, ...payload };
    emitLine(full);
    pushDebugProductEvent(full);
  });
}

/**
 * localStorage ile tarayıcı başına bir kez (ör. ilk mesaj). Depolama kapalıysa sessizce atlanır.
 */
export function trackFirstTimeOnce(storageKey: string, payload: ProductTrackPayload): void {
  if (typeof window === "undefined") return;
  try {
    if (localStorage.getItem(storageKey)) return;
    localStorage.setItem(storageKey, "1");
    queueMicrotask(() => {
      const ts = Date.now();
      const full = { ts, scope: "client" as const, ...payload, firstTime: true };
      emitLine(full);
      pushDebugProductEvent(full);
    });
  } catch {
    /* private mode vb. */
  }
}
