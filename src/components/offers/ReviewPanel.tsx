"use client";

/**
 * Eski “yorumlu” değerlendirme (Review API). Sohbet ekranında yerini
 * CollaborationRatingPanel aldı; bileşen başka yerlerde kullanılabilir.
 */

import type { OfferStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type ReviewRow = {
  id: string;
  reviewerUserId: string;
  revieweeUserId: string;
  rating: number;
  comment: string | null;
  isPublic: boolean;
  createdAt: string;
  reviewer: { id: string; name: string };
  reviewee: { id: string; name: string };
};

export function ReviewPanel({
  offerId,
  offerStatus,
  meId,
}: {
  offerId: string;
  offerStatus: OfferStatus;
  meId: string;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(() => offerStatus === "COMPLETED");
  const [error, setError] = useState<string | null>(null);
  const [myReview, setMyReview] = useState<ReviewRow | null>(null);

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const busyRef = useRef(false);

  const loadReviews = useCallback(async () => {
    if (offerStatus !== "COMPLETED") return;
    setError(null);
    try {
      const res = await fetch(`/api/offers/${offerId}/reviews`, { cache: "no-store" });
      const data = (await res.json().catch(() => null)) as {
        reviews?: ReviewRow[];
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Değerlendirmeler yüklenemedi.");
        setMyReview(null);
        return;
      }
      const list = Array.isArray(data.reviews) ? data.reviews : [];
      const mine = list.find((r) => r.reviewerUserId === meId) ?? null;
      setMyReview(mine);
    } catch {
      setError("Bağlantı hatası.");
      setMyReview(null);
    } finally {
      setLoading(false);
    }
  }, [offerId, meId, offerStatus]);

  useEffect(() => {
    if (offerStatus !== "COMPLETED") {
      setLoading(false);
      return;
    }
    setLoading(true);
    void loadReviews();
  }, [offerStatus, loadReviews]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (offerStatus !== "COMPLETED") return;
    if (busyRef.current || submitting) return;
    busyRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const trimmed = comment.trim();
      const res = await fetch(`/api/offers/${offerId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rating,
          ...(trimmed ? { comment: trimmed } : {}),
          isPublic,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        review?: ReviewRow;
      };
      if (!res.ok) {
        setError(data.error ?? "Değerlendirme gönderilemedi.");
        return;
      }
      if (data.review) {
        setMyReview(data.review);
      } else {
        await loadReviews();
      }
      router.refresh();
    } catch {
      setError("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
      busyRef.current = false;
    }
  }

  if (offerStatus !== "COMPLETED") {
    return null;
  }

  return (
    <section className="chat-panel chat-panel--review" aria-labelledby="chat-review-heading">
      <h3 id="chat-review-heading" className="chat-panel__section-title">
        Değerlendirme
      </h3>
      <p className="chat-panel__section-hint muted">
        İş birliği tamamlandıktan sonra karşı tarafı değerlendirebilirsiniz.
      </p>

      {loading && (
        <div aria-hidden>
          <div className="skeleton skeleton-line" style={{ marginBottom: 8 }} />
          <div className="skeleton skeleton-line skeleton-line--short" />
        </div>
      )}
      {error && <p className="alert-inline alert-inline--error">{error}</p>}

      {!loading && myReview && (
        <div style={{ marginTop: 8 }}>
          <p style={{ color: "#047857", fontSize: "0.9rem", marginTop: 0 }}>{`Bu iş birliği için değerlendirmeniz kaydedildi.`}</p>
          <p className="muted" style={{ margin: "8px 0 4px", fontSize: "0.9rem" }}>
            <strong>Puan:</strong> {myReview.rating}/5
          </p>
          {myReview.comment ? (
            <p className="muted" style={{ margin: "4px 0", fontSize: "0.9rem" }}>
              <strong>Yorumunuz:</strong> {myReview.comment}
            </p>
          ) : (
            <p className="muted" style={{ margin: "4px 0", fontSize: "0.88rem" }}>
              Yorum eklenmedi.
            </p>
          )}
          <p className="muted" style={{ margin: "4px 0 0", fontSize: "0.85rem" }}>
            {myReview.isPublic ? "Profilde görünür." : "Profilde gizli."}
          </p>
        </div>
      )}

      {!loading && !myReview && (
        <form onSubmit={handleSubmit} style={{ marginTop: 8 }}>
          <label htmlFor="review-rating" style={{ display: "block", marginTop: 6 }}>
            Puan (1–5)
          </label>
          <select
            id="review-rating"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            disabled={submitting}
            style={{ maxWidth: "100%" }}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <label htmlFor="review-comment" style={{ display: "block", marginTop: 8 }}>
            Yorum (isteğe bağlı)
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            disabled={submitting}
            rows={3}
            placeholder="Deneyiminizi kısaca yazın"
            style={{ maxWidth: "100%", width: "100%" }}
          />

          <label
            htmlFor="review-public"
            style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, cursor: "pointer" }}
          >
            <input
              id="review-public"
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              disabled={submitting}
            />
            <span style={{ fontSize: "0.9rem" }}>Değerlendirmeyi herkese açık göster</span>
          </label>

          <div style={{ marginTop: 10 }}>
            <button className="btn" type="submit" disabled={submitting}>
              {submitting ? "Gönderiliyor…" : "Değerlendirmeyi Gönder"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
