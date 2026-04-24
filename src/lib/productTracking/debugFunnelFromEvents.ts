import type { DebugProductEventRecord } from "@/lib/productTracking/debugProductEventStore";

/**
 * Huni adımları — mevcut trackProductEvent isimlerine göre türetilir (yeni track çağrısı yok).
 *
 * - discover_view: keşif etkileşimi (`discover_filter_click`, `discover_search_submit`)
 * - profile_view: profil CTA tıklaması (`profile_cta_click`)
 * - collaboration_form_submit_intent, collaboration_created, chat_open, message_sent: birebir event adı
 */
export type DebugFunnelStepKey =
  | "discover_view"
  | "profile_view"
  | "collaboration_form_submit_intent"
  | "collaboration_created"
  | "chat_open"
  | "message_sent";

export type DebugFunnelStepRow = {
  key: DebugFunnelStepKey;
  /** Panelde gösterilen kısa etiket */
  label: string;
  count: number;
};

export const DEBUG_FUNNEL_STEP_ORDER: readonly { key: DebugFunnelStepKey; label: string }[] = [
  { key: "discover_view", label: "Discover" },
  { key: "profile_view", label: "Profile" },
  { key: "collaboration_form_submit_intent", label: "Offer intent" },
  { key: "collaboration_created", label: "Collaboration created" },
  { key: "chat_open", label: "Chat opened" },
  { key: "message_sent", label: "Message sent" },
];

export function matchDebugFunnelStep(row: DebugProductEventRecord, key: DebugFunnelStepKey): boolean {
  const { event } = row;
  switch (key) {
    case "discover_view":
      return event === "discover_filter_click" || event === "discover_search_submit";
    case "profile_view":
      return event === "profile_cta_click";
    case "collaboration_form_submit_intent":
    case "collaboration_created":
    case "chat_open":
    case "message_sent":
      return event === key;
    default:
      return false;
  }
}

/** Mevcut oturum buffer’ındaki olaylardan adım başına tekrar sayısı (yeniden hesap, ek depolama yok). */
export function computeDebugFunnelCounts(rows: readonly DebugProductEventRecord[]): DebugFunnelStepRow[] {
  const counts = new Map<DebugFunnelStepKey, number>();
  for (const s of DEBUG_FUNNEL_STEP_ORDER) counts.set(s.key, 0);

  for (const row of rows) {
    for (const s of DEBUG_FUNNEL_STEP_ORDER) {
      if (matchDebugFunnelStep(row, s.key)) {
        counts.set(s.key, (counts.get(s.key) ?? 0) + 1);
        break;
      }
    }
  }

  return DEBUG_FUNNEL_STEP_ORDER.map(({ key, label }) => ({
    key,
    label,
    count: counts.get(key) ?? 0,
  }));
}
