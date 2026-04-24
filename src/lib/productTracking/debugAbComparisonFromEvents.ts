import type { DebugFunnelStepKey } from "@/lib/productTracking/debugFunnelFromEvents";
import { DEBUG_FUNNEL_STEP_ORDER, matchDebugFunnelStep } from "@/lib/productTracking/debugFunnelFromEvents";
import type { DebugProductEventRecord } from "@/lib/productTracking/debugProductEventStore";

export type AbLabel = "A" | "B";

/** Buffer satırındaki `extra.variant` (trackProductEvent ile gelir). */
export function getRowAbVariant(row: DebugProductEventRecord): AbLabel | null {
  const v = row.extra?.variant;
  return v === "A" || v === "B" ? v : null;
}

export type DebugAbFunnelSplitRow = {
  key: DebugFunnelStepKey;
  label: string;
  countA: number;
  countB: number;
  /** variant alanı olmayan veya A/B dışı */
  countUnassigned: number;
};

/** Huni adımları: olay `extra.variant` ile A / B / atanmamış ayrılır. */
export function computeDebugAbFunnelSplit(rows: readonly DebugProductEventRecord[]): DebugAbFunnelSplitRow[] {
  const buckets = new Map<DebugFunnelStepKey, { a: number; b: number; u: number }>();
  for (const s of DEBUG_FUNNEL_STEP_ORDER) {
    buckets.set(s.key, { a: 0, b: 0, u: 0 });
  }

  for (const row of rows) {
    for (const s of DEBUG_FUNNEL_STEP_ORDER) {
      if (!matchDebugFunnelStep(row, s.key)) continue;
      const ab = getRowAbVariant(row);
      const cur = buckets.get(s.key)!;
      if (ab === "A") cur.a += 1;
      else if (ab === "B") cur.b += 1;
      else cur.u += 1;
      break;
    }
  }

  return DEBUG_FUNNEL_STEP_ORDER.map(({ key, label }) => {
    const c = buckets.get(key)!;
    return {
      key,
      label,
      countA: c.a,
      countB: c.b,
      countUnassigned: c.u,
    };
  });
}

function pctRounded(numerator: number, denominator: number): number | null {
  if (denominator <= 0) return null;
  return Math.round((100 * numerator) / denominator);
}

export type DebugAbRatioRow = {
  id: string;
  label: string;
  fromKey: DebugFunnelStepKey;
  toKey: DebugFunnelStepKey;
  pctA: number | null;
  pctB: number | null;
  numeratorA: number;
  numeratorB: number;
  denominatorA: number;
  denominatorB: number;
};

/**
 * Oturum buffer’ında, yalnızca ilgili adımda `variant` etiketi olan olaylar sayılır.
 * Oran: (hedef adım, V) / (kaynak adım, V).
 */
export function computeDebugAbConversionRatios(rows: readonly DebugProductEventRecord[]): DebugAbRatioRow[] {
  const split = computeDebugAbFunnelSplit(rows);
  const byKey = Object.fromEntries(split.map((s) => [s.key, s])) as Record<DebugFunnelStepKey, DebugAbFunnelSplitRow>;

  const pairs: { id: string; label: string; from: DebugFunnelStepKey; to: DebugFunnelStepKey }[] = [
    {
      id: "profile_to_offer",
      label: "Profile → offer intent",
      from: "profile_view",
      to: "collaboration_form_submit_intent",
    },
    {
      id: "offer_to_collab",
      label: "Offer intent → collaboration created",
      from: "collaboration_form_submit_intent",
      to: "collaboration_created",
    },
    {
      id: "chat_to_message",
      label: "Chat opened → message sent",
      from: "chat_open",
      to: "message_sent",
    },
  ];

  return pairs.map(({ id, label, from, to }) => {
    const f = byKey[from];
    const t = byKey[to];
    return {
      id,
      label,
      fromKey: from,
      toKey: to,
      pctA: pctRounded(t.countA, f.countA),
      pctB: pctRounded(t.countB, f.countB),
      numeratorA: t.countA,
      numeratorB: t.countB,
      denominatorA: f.countA,
      denominatorB: f.countB,
    };
  });
}
