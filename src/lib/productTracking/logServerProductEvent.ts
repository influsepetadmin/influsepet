import type { ProductTrackPayload } from "@/lib/productTracking/productEvents";

const PREFIX = "[influsepet:track]";

/** API route / sunucu işlemleri — senkron, yalnızca console. */
export function logServerProductEvent(payload: ProductTrackPayload & { uid?: string }): void {
  console.info(PREFIX, { ts: Date.now(), scope: "server", ...payload });
}
