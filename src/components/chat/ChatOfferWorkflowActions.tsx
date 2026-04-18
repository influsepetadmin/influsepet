"use client";

import type { OfferStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const ACTION_LABELS: Record<OfferStatus, string> = {
  PENDING: "Bekliyor",
  ACCEPTED: "Kabul Et",
  REJECTED: "Reddet",
  CANCELLED: "İptal Et",
  IN_PROGRESS: "İşe Başla",
  DELIVERED: "Teslim Et",
  REVISION_REQUESTED: "Revize İste",
  COMPLETED: "Tamamlandı Olarak İşaretle",
  DISPUTED: "Anlaşmazlık Bildir",
};

const DELIVERY_DRIVEN: OfferStatus[] = ["DELIVERED", "COMPLETED", "REVISION_REQUESTED"];

const ACTION_ORDER: OfferStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "IN_PROGRESS",
  "CANCELLED",
  "DISPUTED",
];

function sortTransitions(t: OfferStatus[]): OfferStatus[] {
  return [...t].sort((a, b) => ACTION_ORDER.indexOf(a) - ACTION_ORDER.indexOf(b));
}

function transitionButtonClass(next: OfferStatus): string {
  const primary = next === "ACCEPTED" || next === "IN_PROGRESS";
  if (primary) return "btn btn--sm";
  if (next === "REJECTED" || next === "CANCELLED" || next === "DISPUTED") {
    return "btn secondary btn--subtle btn--sm";
  }
  return "btn secondary btn--sm";
}

function isPrimaryAction(next: OfferStatus): boolean {
  return next === "ACCEPTED" || next === "IN_PROGRESS";
}

export function ChatOfferWorkflowActions({
  offerId,
  availableNextTransitions,
  profileHref,
  offersPanelHref,
  showDeliveryShortcut,
}: {
  offerId: string;
  availableNextTransitions: OfferStatus[];
  profileHref: string;
  offersPanelHref: string;
  /** When collaboration is in a delivery-capable state — scroll to #chat-delivery-anchor */
  showDeliveryShortcut: boolean;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const cancelVazgecRef = useRef<HTMLButtonElement>(null);
  const focusBeforeCancelRef = useRef<HTMLElement | null>(null);
  const cancelWasOpenRef = useRef(false);

  const transitions = sortTransitions(
    availableNextTransitions.filter((t) => !DELIVERY_DRIVEN.includes(t)),
  );

  const runTransition = useCallback(
    async (nextStatus: OfferStatus) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setError(null);
      setPendingKey(`${offerId}:${nextStatus}`);
      try {
        const res = await fetch(`/api/offers/${offerId}/transition`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ nextStatus }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setError(data.error ?? "İşlem tamamlanamadı.");
          return;
        }
        router.refresh();
      } catch {
        setError("Bağlantı hatası.");
      } finally {
        busyRef.current = false;
        setPendingKey(null);
      }
    },
    [offerId, router],
  );

  useEffect(() => {
    if (!cancelOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCancelOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelOpen]);

  useEffect(() => {
    if (cancelOpen) {
      cancelWasOpenRef.current = true;
      cancelVazgecRef.current?.focus();
      return;
    }
    if (!cancelWasOpenRef.current) return;
    cancelWasOpenRef.current = false;
    const el = focusBeforeCancelRef.current;
    focusBeforeCancelRef.current = null;
    if (el?.isConnected) requestAnimationFrame(() => el.focus());
  }, [cancelOpen]);

  const confirmCancel = useCallback(() => {
    setCancelOpen(false);
    focusBeforeCancelRef.current = null;
    void runTransition("CANCELLED");
  }, [runTransition]);

  const openCancel = useCallback(() => {
    const ae = document.activeElement;
    focusBeforeCancelRef.current = ae instanceof HTMLElement ? ae : null;
    setCancelOpen(true);
  }, []);

  const scrollToDelivery = useCallback(() => {
    document.getElementById("chat-delivery-anchor")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="chat-workflow-actions">
      {error ? (
        <p className="alert-inline alert-inline--error chat-workflow-actions__err" role="alert">
          {error}
        </p>
      ) : null}

      {transitions.length > 0 ? (
        <div className="chat-workflow-actions__row chat-workflow-actions__row--primary">
          {transitions.map((next) => {
            const key = `${offerId}:${next}`;
            const loading = pendingKey === key;
            const disabled = Boolean(pendingKey) || cancelOpen;
            return (
              <button
                key={next}
                type="button"
                className={transitionButtonClass(next)}
                disabled={disabled}
                data-chat-priority={isPrimaryAction(next) ? "high" : "low"}
                onClick={() => {
                  if (next === "CANCELLED") {
                    openCancel();
                    return;
                  }
                  void runTransition(next);
                }}
                style={{ opacity: loading ? 0.75 : 1 }}
              >
                {loading ? "…" : ACTION_LABELS[next] ?? next}
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="chat-workflow-actions__row chat-workflow-actions__row--secondary">
        {showDeliveryShortcut ? (
          <button type="button" className="btn secondary btn--sm" onClick={scrollToDelivery}>
            Teslim bölümü
          </button>
        ) : null}
        <Link className="btn secondary btn--sm" href={profileHref}>
          Profil
        </Link>
        <Link className="btn secondary btn--sm" href={offersPanelHref}>
          Teklifler
        </Link>
      </div>

      {cancelOpen ? (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onClick={() => setCancelOpen(false)}
        >
          <div
            className="confirm-dialog-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`chat-cancel-title-${offerId}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={`chat-cancel-title-${offerId}`} className="confirm-dialog-panel__title">
              İş birliğini iptal et
            </h2>
            <p className="confirm-dialog-panel__body muted">Bu işlem geri alınamaz. Devam etmek istiyor musunuz?</p>
            <div className="confirm-dialog-panel__actions">
              <button
                ref={cancelVazgecRef}
                type="button"
                className="btn secondary"
                onClick={() => setCancelOpen(false)}
              >
                Vazgeç
              </button>
              <button type="button" className="btn btn--danger" onClick={confirmCancel}>
                Evet, iptal et
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
