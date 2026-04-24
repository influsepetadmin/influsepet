"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { OfferStatus } from "@prisma/client";
import { formatCommissionPercentTr } from "@/lib/platformCommission";
import type { RateeReputationStats } from "@/lib/offers/rateeReputation";
import { PublicProfileIconStar } from "@/components/profile/public/publicProfileInfluencerIcons";
import type { CollaborationCardOffer } from "./collaborationCardOffer";
import { CollabMetaChipIcon } from "./collabMetaChipIcon";
import { StatusBadge } from "./StatusBadge";
import { getProfileCtaAbVariantForTrack } from "@/lib/productTracking/profileCtaAb";
import { trackProductEvent } from "@/lib/productTracking/productEvents";

export type { CollaborationCardOffer } from "./collaborationCardOffer";

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

const DELIVERY_DRIVEN_STATUSES: OfferStatus[] = ["DELIVERED", "COMPLETED", "REVISION_REQUESTED"];

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

function isPrimaryAction(next: OfferStatus): boolean {
  return next === "ACCEPTED" || next === "IN_PROGRESS";
}

function transitionButtonClass(next: OfferStatus): string {
  if (isPrimaryAction(next)) return "btn";
  if (next === "REJECTED" || next === "CANCELLED" || next === "DISPUTED") {
    return "btn secondary btn--subtle";
  }
  return "btn secondary";
}

function briefPreview(brief: string, max = 160): string {
  const t = brief.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max).trim()}…`;
}

function formatDue(d: string | null | undefined): string | null {
  if (!d) return null;
  try {
    return new Date(d).toLocaleDateString("tr-TR", { dateStyle: "medium" });
  } catch {
    return null;
  }
}

function formatShortDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return "—";
  }
}

function counterpartyRatingBadge(
  status: OfferStatus,
  rep: RateeReputationStats | null | undefined,
): { averageRating: number; ratingCount: number } | null {
  if (status !== "COMPLETED" || !rep) return null;
  if (rep.ratingCount === 0 || rep.averageRating == null) return null;
  return { averageRating: rep.averageRating, ratingCount: rep.ratingCount };
}

export function CollaborationCard({
  offer,
  otherSideLabel,
  otherSideName,
  profileHref,
  chatHref,
  availableNextTransitions,
  counterpartyRating,
}: {
  offer: CollaborationCardOffer;
  otherSideLabel: string;
  otherSideName: string;
  profileHref: string | null;
  chatHref: string | null;
  availableNextTransitions: OfferStatus[];
  /** Karşı tarafın (iş birliği puanları) özeti; yalnızca COMPLETED kartlarda anlamlı. */
  counterpartyRating?: RateeReputationStats | null;
}) {
  const router = useRouter();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);
  const cancelDialogVazgecRef = useRef<HTMLButtonElement | null>(null);
  const elementFocusedBeforeCancelDialogRef = useRef<HTMLElement | null>(null);
  const cancelDialogWasOpenRef = useRef(false);

  useEffect(() => {
    if (!cancelConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCancelConfirmOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cancelConfirmOpen]);

  useEffect(() => {
    if (cancelConfirmOpen) {
      cancelDialogWasOpenRef.current = true;
      cancelDialogVazgecRef.current?.focus();
      return;
    }
    if (!cancelDialogWasOpenRef.current) return;
    cancelDialogWasOpenRef.current = false;
    const el = elementFocusedBeforeCancelDialogRef.current;
    elementFocusedBeforeCancelDialogRef.current = null;
    if (el && el.isConnected && typeof el.focus === "function") {
      requestAnimationFrame(() => el.focus());
    }
  }, [cancelConfirmOpen]);

  const displayName =
    (offer.campaignName && offer.campaignName.trim()) ||
    (offer.title && offer.title.trim()) ||
    "İşbirliği isteği";

  const budget = offer.budgetTRY ?? offer.offerAmountTRY;
  const transitions = sortTransitions(
    availableNextTransitions.filter((t) => !DELIVERY_DRIVEN_STATUSES.includes(t)),
  );

  const showDeliveryNote =
    offer.status === "IN_PROGRESS" || offer.status === "DELIVERED" || offer.status === "REVISION_REQUESTED";

  const metaChips = useMemo(() => {
    const dueStr = formatDue(offer.dueDate);
    const chips: { key: string; label: string; value: string }[] = [];
    chips.push({
      key: "offer",
      label: "Teklif tutarı",
      value: `${offer.offerAmountTRY.toLocaleString("tr-TR")} TRY`,
    });
    const ratePct = formatCommissionPercentTr(offer.commissionRate);
    chips.push({
      key: "commission",
      label: "Komisyon",
      value: `${offer.commissionTRY.toLocaleString("tr-TR")} TRY (${ratePct}%)`,
    });
    chips.push({
      key: "net",
      label: "Net ödeme",
      value: `${offer.netPayoutTRY.toLocaleString("tr-TR")} TRY`,
    });
    if (dueStr) {
      chips.push({ key: "due", label: "Teslim tarihi", value: dueStr });
    }
    if (offer.deliverableType || offer.deliverableCount != null) {
      const parts: string[] = [];
      if (offer.deliverableType) parts.push(offer.deliverableType);
      if (offer.deliverableCount != null) parts.push(`${offer.deliverableCount} adet`);
      chips.push({ key: "deliverable", label: "İçerik", value: parts.join(" · ") });
    }
    if (offer.revisionCount > 0) {
      chips.push({
        key: "rev",
        label: "Revizyon turu",
        value: String(offer.revisionCount),
      });
    }
    if (offer.deliveryCount > 0) {
      chips.push({
        key: "deliveries",
        label: "Teslim kaydı",
        value: String(offer.deliveryCount),
      });
    }
    chips.push({
      key: "created",
      label: "Oluşturulma",
      value: formatShortDateTime(offer.createdAt),
    });
    chips.push({
      key: "updated",
      label: "Güncellendi",
      value: formatShortDateTime(offer.updatedAt),
    });
    return chips;
  }, [offer]);

  const runTransition = useCallback(
    async (nextStatus: OfferStatus) => {
      if (busyRef.current) return;
      const key = `${offer.id}:${nextStatus}`;
      busyRef.current = true;
      setError(null);
      setPendingKey(key);
      try {
        const res = await fetch(`/api/offers/${offer.id}/transition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
    [offer.id, router],
  );

  const confirmCancelCollaboration = useCallback(() => {
    setCancelConfirmOpen(false);
    elementFocusedBeforeCancelDialogRef.current = null;
    void runTransition("CANCELLED");
  }, [runTransition]);

  const openCancelConfirmation = useCallback(() => {
    const ae = document.activeElement;
    elementFocusedBeforeCancelDialogRef.current =
      ae instanceof HTMLElement ? ae : null;
    setCancelConfirmOpen(true);
  }, []);

  const hasBrief = Boolean(offer.brief.trim());
  const ratingBadge = counterpartyRatingBadge(offer.status, counterpartyRating ?? null);

  return (
    <article
      className="collab-card collab-card--surface"
      data-offer-status={offer.status}
    >
      <header className="collab-card__head">
        <h3 className="collab-card__campaign">{displayName}</h3>
        <StatusBadge status={offer.status} />
      </header>

      <div className="collab-card__party">
        <span className="collab-card__party-label">{otherSideLabel}</span>
        <span className="collab-card__party-name">{otherSideName}</span>
        {ratingBadge ? (
          <div
            className="collab-card__rating-badge"
            title="Karşı tarafın tamamlanan iş birliklerindeki ortalama puanı"
            aria-label={`Karşı tarafın ortalama puanı ${ratingBadge.averageRating.toFixed(1)}, ${ratingBadge.ratingCount} puanlama`}
          >
            <span className="collab-card__rating-badge-star" aria-hidden>
              <PublicProfileIconStar className="collab-card__rating-star-icon" />
            </span>
            <span className="collab-card__rating-badge-score">
              {ratingBadge.averageRating.toFixed(1)}
            </span>
            <span className="collab-card__rating-badge-meta">
              {ratingBadge.ratingCount.toLocaleString("tr-TR")} puanlama
            </span>
          </div>
        ) : null}
      </div>

      <div className="collab-card__budget-block">
        <span className="collab-card__budget-label">Bütçe</span>
        <span className="collab-card__budget-value">
          <span className="collab-card__budget-amount">
            {budget.toLocaleString("tr-TR")}
          </span>
          <span className="collab-card__budget-currency">TRY</span>
        </span>
      </div>

      {metaChips.length > 0 ? (
        <ul className="collab-card__meta-chips" aria-label="Teklif detayları">
          {metaChips.map((c) => (
            <li key={c.key} className="collab-meta-chip">
              <span className="collab-meta-chip__icon-wrap" aria-hidden>
                <CollabMetaChipIcon chipKey={c.key} />
              </span>
              <div className="collab-meta-chip__body">
                <span className="collab-meta-chip__label">{c.label}</span>
                <span className="collab-meta-chip__value">{c.value}</span>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {hasBrief ? (
        <div className="collab-card__brief">
          <p className="collab-card__brief-label">Özet</p>
          <p className="collab-card__brief-text">{briefPreview(offer.brief)}</p>
        </div>
      ) : null}

      {error ? <p className="alert-inline alert-inline--error collab-card__alert">{error}</p> : null}

      <div className="collab-card__actions collab-card__actions--primary">
        {chatHref ? (
          <a
            className="btn"
            href={chatHref}
            onClick={() =>
              trackProductEvent({
                event: "chat_open",
                location: "offers_or_collab_card",
                label: "sohbete_git",
                offerId: offer.id,
              })
            }
          >
            Sohbete git
          </a>
        ) : null}
        {profileHref ? (
          <a
            className="btn secondary"
            href={profileHref}
            onClick={() =>
              trackProductEvent({
                event: "profile_cta_click",
                location: "offers_or_collab_card",
                label: "profili_goruntule",
                offerId: offer.id,
                variant: getProfileCtaAbVariantForTrack(),
              })
            }
          >
            Profili görüntüle
          </a>
        ) : null}
      </div>

      {showDeliveryNote ? (
        <p className="muted collab-card__hint">
          Teslim ve inceleme işlemleri sohbet ekranından yönetilecektir.
        </p>
      ) : null}

      {transitions.length > 0 ? (
        <div className="collab-card__actions collab-card__actions--transitions">
          {transitions.map((next) => {
            const key = `${offer.id}:${next}`;
            const loading = pendingKey === key;
            const disabled = Boolean(pendingKey) || cancelConfirmOpen;
            return (
              <button
                key={next}
                type="button"
                className={transitionButtonClass(next)}
                disabled={disabled}
                onClick={() => {
                  if (next === "CANCELLED") {
                    openCancelConfirmation();
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

      {cancelConfirmOpen ? (
        <div
          className="confirm-dialog-backdrop"
          role="presentation"
          onClick={() => setCancelConfirmOpen(false)}
        >
          <div
            className="confirm-dialog-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`collab-cancel-title-${offer.id}`}
            aria-describedby={`collab-cancel-desc-${offer.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={`collab-cancel-title-${offer.id}`} className="confirm-dialog-panel__title">
              İş birliğini iptal et
            </h2>
            <div id={`collab-cancel-desc-${offer.id}`} className="confirm-dialog-panel__body-stack">
              <p className="confirm-dialog-panel__body">İptal etmek istediğinize emin misiniz?</p>
              <p className="confirm-dialog-panel__body-note muted">Bu işlem geri alınamaz.</p>
            </div>
            <div className="confirm-dialog-panel__actions">
              <button
                ref={cancelDialogVazgecRef}
                type="button"
                className="btn secondary"
                onClick={() => setCancelConfirmOpen(false)}
              >
                Vazgeç
              </button>
              <button type="button" className="btn btn--danger" onClick={confirmCancelCollaboration}>
                Evet, iptal et
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}
