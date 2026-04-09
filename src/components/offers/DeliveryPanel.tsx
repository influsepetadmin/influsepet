"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DeliveryStatus, OfferStatus } from "@prisma/client";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { StatusBadge } from "./StatusBadge";

type DeliveryRow = {
  id: string;
  deliveryUrl: string | null;
  deliveryText: string | null;
  status: DeliveryStatus;
  createdAt: string;
  submittedBy: { id: string; name: string };
};

const DELIVERY_STATUS_TR: Record<DeliveryStatus, string> = {
  SUBMITTED: "Gönderildi",
  APPROVED: "Onaylandı",
  REVISION_REQUESTED: "Revize istendi",
};

function timelineItemClass(status: DeliveryStatus): string {
  if (status === "APPROVED") return "chat-delivery-timeline__item chat-delivery-timeline__item--approved";
  if (status === "REVISION_REQUESTED") {
    return "chat-delivery-timeline__item chat-delivery-timeline__item--revision";
  }
  return "chat-delivery-timeline__item chat-delivery-timeline__item--submitted";
}

function preview(s: string | null, max = 72): string {
  if (!s?.trim()) return "—";
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

export function DeliveryPanel({
  offerId,
  offerStatus,
  brandId,
  influencerId,
  meId,
  offerTitle,
}: {
  offerId: string;
  offerStatus: OfferStatus;
  brandId: string;
  influencerId: string;
  meId: string;
  offerTitle: string;
}) {
  const router = useRouter();
  const isInfluencer = influencerId === meId;
  const isBrand = brandId === meId;

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [deliveryText, setDeliveryText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reviewBusy, setReviewBusy] = useState<"APPROVE" | "REQUEST_REVISION" | null>(null);
  const busySubmit = useRef(false);

  const loadDeliveries = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/deliveries`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as { deliveries?: DeliveryRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Teslim listesi alınamadı.");
        setDeliveries([]);
        return;
      }
      setDeliveries(Array.isArray(data.deliveries) ? data.deliveries : []);
    } catch {
      setError("Bağlantı hatası.");
      setDeliveries([]);
    } finally {
      setLoading(false);
    }
  }, [offerId]);

  useEffect(() => {
    void loadDeliveries();
  }, [loadDeliveries]);

  const pendingReview = deliveries.find((d) => d.status === "SUBMITTED");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = deliveryUrl.trim();
    const note = deliveryText.trim();
    if (!url && !note) {
      setError("Teslim bağlantısı veya teslim notu girin.");
      return;
    }
    if (busySubmit.current || submitting) return;
    busySubmit.current = true;
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/deliveries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(url ? { deliveryUrl: url } : {}),
          ...(note ? { deliveryText: note } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Teslim gönderilemedi.");
        return;
      }
      setDeliveryUrl("");
      setDeliveryText("");
      setFeedback("Teslim başarıyla gönderildi.");
      await loadDeliveries();
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
      busySubmit.current = false;
    }
  }

  async function handleReview(action: "APPROVE" | "REQUEST_REVISION") {
    if (!pendingReview || reviewBusy) return;
    setReviewBusy(action);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/deliveries/${pendingReview.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: action === "APPROVE" ? "APPROVE" : "REQUEST_REVISION" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "İşlem yapılamadı.");
        return;
      }
      setFeedback(action === "APPROVE" ? "Teslim onaylandı." : "Revize istendi.");
      await loadDeliveries();
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setReviewBusy(null);
    }
  }

  const showSubmit = isInfluencer && offerStatus === "IN_PROGRESS";
  const showReview =
    isBrand && offerStatus === "DELIVERED" && Boolean(pendingReview);

  return (
    <section className="chat-panel chat-panel--delivery" aria-labelledby="chat-delivery-heading">
      <div className="chat-panel__context chat-delivery-context">
        <span className="chat-panel__context-label">İş birliği</span>
        <div className="chat-panel__context-row">
          <strong className="chat-panel__context-title">{offerTitle}</strong>
          <StatusBadge status={offerStatus} />
        </div>
      </div>

      <div className="chat-delivery-head">
        <span className="chat-delivery-eyebrow">Teslimat</span>
        <h3 id="chat-delivery-heading" className="chat-delivery-title">
          Teslim
        </h3>
        <p className="chat-delivery-lede muted">
          İçerik teslimlerinizi buradan gönderin veya marka olarak inceleyin.
        </p>
      </div>

      {loading && (
        <div className="chat-delivery-skeleton" aria-hidden>
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line--short" />
        </div>
      )}
      {error && <p className="alert-inline alert-inline--error chat-delivery-alert">{error}</p>}
      {feedback && <p className="alert-inline alert-inline--success chat-delivery-alert">{feedback}</p>}

      {!loading && showSubmit && (
        <form className="chat-delivery-form" onSubmit={handleSubmit}>
          <div className="chat-delivery-field">
            <label className="chat-delivery-label" htmlFor="delivery-url">
              Teslim bağlantısı
            </label>
            <input
              id="delivery-url"
              className="chat-delivery-input"
              type="text"
              inputMode="url"
              value={deliveryUrl}
              onChange={(e) => setDeliveryUrl(e.target.value)}
              disabled={submitting}
              placeholder="https://..."
              autoComplete="off"
            />
          </div>
          <div className="chat-delivery-field">
            <label className="chat-delivery-label" htmlFor="delivery-note">
              Teslim notu
            </label>
            <textarea
              id="delivery-note"
              className="chat-delivery-textarea"
              value={deliveryText}
              onChange={(e) => setDeliveryText(e.target.value)}
              disabled={submitting}
              rows={3}
              placeholder="Kısa açıklama"
            />
          </div>
          <div className="chat-delivery-form-actions">
            <button className="btn chat-delivery-submit" type="submit" disabled={submitting}>
              {submitting ? "Gönderiliyor…" : "Teslim gönder"}
            </button>
          </div>
        </form>
      )}

      {!loading && !showSubmit && showReview && pendingReview && (
        <div className="chat-delivery-review">
          <h4 className="chat-delivery-review__title">Son teslim — inceleme</h4>
          {pendingReview.deliveryUrl && (
            <p className="chat-delivery-review__line">
              <span className="chat-delivery-review__k">Bağlantı</span>
              <a
                className="chat-delivery-review__link"
                href={pendingReview.deliveryUrl}
                target="_blank"
                rel="noreferrer"
              >
                {preview(pendingReview.deliveryUrl, 80)}
              </a>
            </p>
          )}
          {pendingReview.deliveryText && (
            <p className="chat-delivery-review__line">
              <span className="chat-delivery-review__k">Not</span>
              <span className="chat-delivery-review__text">{preview(pendingReview.deliveryText, 200)}</span>
            </p>
          )}
          <p className="chat-delivery-review__meta muted">
            {pendingReview.submittedBy.name} · {new Date(pendingReview.createdAt).toLocaleString("tr-TR")}
          </p>
          <div className="chat-delivery-actions">
            <button
              type="button"
              className="btn chat-delivery-actions__primary"
              disabled={reviewBusy !== null}
              onClick={() => void handleReview("APPROVE")}
            >
              {reviewBusy === "APPROVE" ? "…" : "Onayla"}
            </button>
            <button
              type="button"
              className="btn secondary chat-delivery-actions__secondary"
              disabled={reviewBusy !== null}
              onClick={() => void handleReview("REQUEST_REVISION")}
            >
              {reviewBusy === "REQUEST_REVISION" ? "…" : "Revize iste"}
            </button>
          </div>
        </div>
      )}

      {!loading && !showSubmit && offerStatus === "DELIVERED" && isBrand && !pendingReview && (
        <p className="chat-delivery-wait-hint muted">İncelenecek teslim kaydı yok.</p>
      )}

      {!loading &&
        deliveries.length === 0 &&
        !showSubmit &&
        !(offerStatus === "DELIVERED" && isBrand && !pendingReview) && (
          <div className="chat-delivery-empty-wrap">
            <EmptyStateCard
              title="Henüz teslim kaydı yok"
              description="Teslim gönderildiğinde veya geçmiş oluştuğunda burada görünür."
            />
          </div>
        )}

      {!loading && deliveries.length > 0 && (
        <div className="chat-delivery-timeline">
          <h4 className="chat-delivery-timeline__title">Teslim geçmişi</h4>
          <ul className="chat-delivery-timeline__list" role="list">
            {deliveries.map((d) => (
              <li key={d.id} className={timelineItemClass(d.status)}>
                <div className="chat-delivery-timeline__row">
                  <span className="chat-delivery-timeline__status">{DELIVERY_STATUS_TR[d.status] ?? d.status}</span>
                  <span className="chat-delivery-timeline__time muted">
                    {new Date(d.createdAt).toLocaleString("tr-TR")}
                  </span>
                </div>
                <div className="chat-delivery-timeline__body muted">
                  {d.deliveryUrl ? (
                    <a href={d.deliveryUrl} target="_blank" rel="noreferrer" className="chat-delivery-timeline__link">
                      Bağlantıyı aç
                    </a>
                  ) : null}
                  {d.deliveryUrl && d.deliveryText ? <span aria-hidden> · </span> : null}
                  {d.deliveryText ? <span>{preview(d.deliveryText, 48)}</span> : null}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
