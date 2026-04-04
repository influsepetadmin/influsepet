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
      <div className="chat-panel__context">
        <span className="chat-panel__context-label muted">İş birliği</span>
        <div className="chat-panel__context-row">
          <strong className="chat-panel__context-title">{offerTitle}</strong>
          <StatusBadge status={offerStatus} />
        </div>
      </div>

      <h3 id="chat-delivery-heading" className="chat-panel__section-title">
        Teslim
      </h3>
      <p className="chat-panel__section-hint muted">
        İçerik teslimlerinizi buradan gönderin veya marka olarak inceleyin.
      </p>

      {loading && (
        <div aria-hidden>
          <div className="skeleton skeleton-line" style={{ marginBottom: 8 }} />
          <div className="skeleton skeleton-line skeleton-line--short" />
        </div>
      )}
      {error && <p className="alert-inline alert-inline--error">{error}</p>}
      {feedback && <p className="alert-inline alert-inline--success">{feedback}</p>}

      {!loading && showSubmit && (
        <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          <label htmlFor="delivery-url" style={{ display: "block", marginTop: 6 }}>
            Teslim Bağlantısı
          </label>
          <input
            id="delivery-url"
            type="url"
            value={deliveryUrl}
            onChange={(e) => setDeliveryUrl(e.target.value)}
            disabled={submitting}
            placeholder="https://..."
            style={{ maxWidth: "100%" }}
          />
          <label htmlFor="delivery-note" style={{ display: "block", marginTop: 8 }}>
            Teslim Notu
          </label>
          <textarea
            id="delivery-note"
            value={deliveryText}
            onChange={(e) => setDeliveryText(e.target.value)}
            disabled={submitting}
            rows={3}
            placeholder="Kısa açıklama"
            style={{ maxWidth: "100%", width: "100%" }}
          />
          <div style={{ marginTop: 8 }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Gönderiliyor…" : "Teslim Gönder"}
            </button>
          </div>
        </form>
      )}

      {!loading && !showSubmit && showReview && pendingReview && (
        <div style={{ marginTop: 8 }}>
          <h4 style={{ margin: "8px 0 6px", fontSize: "0.95rem" }}>Son Teslim</h4>
          {pendingReview.deliveryUrl && (
            <p className="muted" style={{ margin: "4px 0", fontSize: "0.9rem" }}>
              <strong>Bağlantı:</strong>{" "}
              <a href={pendingReview.deliveryUrl} target="_blank" rel="noreferrer">
                {preview(pendingReview.deliveryUrl, 80)}
              </a>
            </p>
          )}
          {pendingReview.deliveryText && (
            <p className="muted" style={{ margin: "4px 0", fontSize: "0.9rem" }}>
              <strong>Not:</strong> {preview(pendingReview.deliveryText, 200)}
            </p>
          )}
          <p className="muted" style={{ margin: "4px 0", fontSize: "0.85rem" }}>
            Gönderen: {pendingReview.submittedBy.name} ·{" "}
            {new Date(pendingReview.createdAt).toLocaleString("tr-TR")}
          </p>
          <div className="btn-row" style={{ marginTop: 10 }}>
            <button
              type="button"
              className="btn"
              disabled={reviewBusy !== null}
              onClick={() => void handleReview("APPROVE")}
            >
              {reviewBusy === "APPROVE" ? "…" : "Onayla"}
            </button>
            <button
              type="button"
              className="btn secondary"
              disabled={reviewBusy !== null}
              onClick={() => void handleReview("REQUEST_REVISION")}
            >
              {reviewBusy === "REQUEST_REVISION" ? "…" : "Revize İste"}
            </button>
          </div>
        </div>
      )}

      {!loading && !showSubmit && offerStatus === "DELIVERED" && isBrand && !pendingReview && (
        <p className="muted" style={{ fontSize: "0.9rem", marginTop: 8 }}>
          İncelenecek teslim kaydı yok.
        </p>
      )}

      {!loading &&
        deliveries.length === 0 &&
        !showSubmit &&
        !(offerStatus === "DELIVERED" && isBrand && !pendingReview) && (
          <EmptyStateCard
            title="Henüz teslim kaydı yok"
            description="Teslim gönderildiğinde veya geçmiş oluştuğunda burada görünür."
          />
        )}

      {!loading && deliveries.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <h4 style={{ margin: "0 0 6px", fontSize: "0.95rem" }}>Teslim Geçmişi</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.88rem" }}>
            {deliveries.map((d) => (
              <li key={d.id} style={{ marginBottom: 6 }}>
                <strong>{DELIVERY_STATUS_TR[d.status] ?? d.status}</strong> ·{" "}
                {new Date(d.createdAt).toLocaleString("tr-TR")}
                {d.deliveryUrl ? (
                  <>
                    {" "}
                    ·{" "}
                    <a href={d.deliveryUrl} target="_blank" rel="noreferrer">
                      Bağlantı
                    </a>
                  </>
                ) : null}
                {d.deliveryText ? <span className="muted"> · {preview(d.deliveryText, 48)}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
