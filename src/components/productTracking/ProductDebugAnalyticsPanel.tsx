"use client";

import {
  getDebugProductEventsSnapshot,
  getServerDebugProductEventsSnapshot,
  subscribeDebugProductEvents,
  clearDebugProductEvents,
  type DebugProductEventRecord,
} from "@/lib/productTracking/debugProductEventStore";
import styles from "@/components/productTracking/ProductDebugAnalyticsPanel.module.css";
import {
  computeDebugAbConversionRatios,
  computeDebugAbFunnelSplit,
} from "@/lib/productTracking/debugAbComparisonFromEvents";
import { computeDebugFunnelCounts } from "@/lib/productTracking/debugFunnelFromEvents";
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

function formatAbRatioLine(pct: number | null, num: number, den: number, letter: string): string {
  if (den <= 0) return `${letter}: —`;
  if (pct === null) return `${letter}: —`;
  return `${letter}: ${pct}% (${num}/${den})`;
}

function formatTs(ts: number): string {
  try {
    return new Date(ts).toLocaleString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      fractionalSecondDigits: 3,
    });
  } catch {
    return String(ts);
  }
}

export function ProductDebugAnalyticsPanel({ onClose }: { onClose: () => void }) {
  const rows = useSyncExternalStore(
    subscribeDebugProductEvents,
    getDebugProductEventsSnapshot,
    getServerDebugProductEventsSnapshot,
  );

  const [eventQ, setEventQ] = useState("");
  const [locationQ, setLocationQ] = useState("");

  const funnel = useMemo(() => computeDebugFunnelCounts(rows), [rows]);
  const abFunnel = useMemo(() => computeDebugAbFunnelSplit(rows), [rows]);
  const abRatios = useMemo(() => computeDebugAbConversionRatios(rows), [rows]);

  const filtered = useMemo(() => {
    const eq = eventQ.trim().toLowerCase();
    const lq = locationQ.trim().toLowerCase();
    return rows.filter((r) => {
      if (eq && !r.event.toLowerCase().includes(eq)) return false;
      if (lq) {
        const loc = (r.location ?? "").toLowerCase();
        if (!loc.includes(lq)) return false;
      }
      return true;
    });
  }, [rows, eventQ, locationQ]);

  const onClear = useCallback(() => {
    clearDebugProductEvents();
  }, []);

  return (
    <div className={styles.wrap} role="dialog" aria-label="Ürün etkileşim debug paneli">
      <div className={styles.panel}>
        <div className={styles.head}>
          <span className={styles.title}>Track debug</span>
          <div className={styles.actions}>
            <span className={styles.hint}>⇧D kapat</span>
            <button type="button" className={styles.btn} onClick={onClose}>
              Kapat
            </button>
            <button type="button" className={styles.btn} onClick={onClear}>
              Temizle
            </button>
          </div>
        </div>
        <div className={styles.filters}>
          <input
            type="search"
            placeholder="event filtre"
            value={eventQ}
            onChange={(e) => setEventQ(e.target.value)}
            aria-label="Olay adına göre filtre"
          />
          <input
            type="search"
            placeholder="location filtre"
            value={locationQ}
            onChange={(e) => setLocationQ(e.target.value)}
            aria-label="Konuma göre filtre"
          />
        </div>
        <section className={styles.funnel} aria-label="Oturum hunisi">
          <div className={styles.funnelTitle}>Funnel</div>
          <p className={styles.funnelHint}>
            Tüm buffer ({rows.length} kayıt); liste filtreleri huniyi değiştirmez.
          </p>
          {funnel.map((step) => (
            <div key={step.key} className={styles.funnelRow}>
              <span>{step.label}</span>
              <span className={styles.funnelCount}>{step.count}</span>
            </div>
          ))}
        </section>
        <section className={styles.abSection} aria-label="A B karşılaştırması">
          <div className={styles.funnelTitle}>A/B comparison</div>
          <p className={styles.funnelHint}>
            A/B kolonları yalnızca <code className={styles.codeInline}>variant</code> alanı olan olayları sayar;
            keşif/profil çoğunlukla “—”.
          </p>
          {abFunnel.map((step) => (
            <div key={step.key} className={styles.abFunnelRow}>
              <span className={styles.abStep}>{step.label}</span>
              <span className={styles.abCounts}>
                A={step.countA} / B={step.countB}
              </span>
              {step.countUnassigned > 0 ? (
                <span className={styles.abUnassigned}>— (variant yok): {step.countUnassigned}</span>
              ) : null}
            </div>
          ))}
          <div className={styles.abSubhead}>Conversion (aynı variant sayıları)</div>
          {abRatios.map((r) => (
            <div key={r.id} className={styles.abRatioRow}>
              <span className={styles.abRatioLabel}>{r.label}</span>
              <span className={styles.abRatioValues}>
                {formatAbRatioLine(r.pctA, r.numeratorA, r.denominatorA, "A")} ·{" "}
                {formatAbRatioLine(r.pctB, r.numeratorB, r.denominatorB, "B")}
              </span>
            </div>
          ))}
        </section>
        <div className={styles.list}>
          {filtered.length === 0 ? (
            <p className={styles.empty}>{rows.length === 0 ? "Henüz olay yok." : "Filtre eşleşmedi."}</p>
          ) : (
            filtered.map((r) => <EventRow key={r.id} r={r} />)
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ r }: { r: DebugProductEventRecord }) {
  const extraStr = r.extra && Object.keys(r.extra).length ? JSON.stringify(r.extra) : null;
  return (
    <div className={styles.row}>
      <div className={styles.ev}>{r.event}</div>
      <div className={styles.meta}>
        <span>{r.location ?? "—"}</span>
        {r.label ? <span>· {r.label}</span> : null}
        <span className={styles.ts}>{formatTs(r.ts)}</span>
        <span>· {r.scope}</span>
      </div>
      {extraStr ? <div className={styles.extra}>{extraStr}</div> : null}
    </div>
  );
}
