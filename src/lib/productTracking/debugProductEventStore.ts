const MAX_EVENTS = 80;

export type DebugProductEventRecord = {
  id: string;
  ts: number;
  scope: "client";
  event: string;
  location?: string;
  label?: string;
  /** Diğer alanlar (ör. conversationId, firstTime) — panelde dar gösterim */
  extra?: Record<string, unknown>;
};

const EMPTY_SNAPSHOT: DebugProductEventRecord[] = [];

let snapshot: DebugProductEventRecord[] = EMPTY_SNAPSHOT;
const listeners = new Set<() => void>();

function notify(): void {
  for (const l of listeners) l();
}

/**
 * Geliştirme sunucusu veya NEXT_PUBLIC_DEBUG_PRODUCT_ANALYTICS=1 ile açılır.
 * Üretimde varsayılan kapalı — bellekte biriktirme yok.
 */
export function isDebugProductAnalyticsEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_PRODUCT_ANALYTICS === "1"
  );
}

export function subscribeDebugProductEvents(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getDebugProductEventsSnapshot(): DebugProductEventRecord[] {
  return snapshot;
}

export function getServerDebugProductEventsSnapshot(): DebugProductEventRecord[] {
  return EMPTY_SNAPSHOT;
}

function pickExtra(rest: Record<string, unknown>): Record<string, unknown> | undefined {
  const keys = Object.keys(rest);
  if (!keys.length) return undefined;
  const out: Record<string, unknown> = {};
  for (const k of keys) {
    const v = rest[k];
    if (v === undefined) continue;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    }
  }
  return Object.keys(out).length ? out : undefined;
}

/** trackProductEvent / trackFirstTimeOnce içinden; yalnızca debug açıkken. */
export function pushDebugProductEvent(row: {
  ts: number;
  scope?: "client";
  event: string;
  location?: string;
  label?: string;
  [key: string]: unknown;
}): void {
  if (!isDebugProductAnalyticsEnabled()) return;
  const { ts, scope = "client", event, location, label, ...rest } = row;
  if (scope !== "client") return;

  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${ts}-${Math.random().toString(36).slice(2, 9)}`;

  const extra = pickExtra(rest as Record<string, unknown>);
  const next: DebugProductEventRecord = {
    id,
    ts,
    scope: "client",
    event: String(event),
    ...(location !== undefined ? { location: String(location) } : {}),
    ...(label !== undefined ? { label: String(label) } : {}),
    ...(extra ? { extra } : {}),
  };

  const prev = snapshot === EMPTY_SNAPSHOT ? [] : snapshot;
  snapshot = [next, ...prev].slice(0, MAX_EVENTS);
  queueMicrotask(notify);
}

export function clearDebugProductEvents(): void {
  snapshot = EMPTY_SNAPSHOT;
  queueMicrotask(notify);
}
