"use client";

import type { OfferStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CollaborationRatingGetResponse,
  CollaborationRatingPostSuccessResponse,
} from "@/lib/offers/collaborationRating";
import { RatingStarsInput } from "./RatingStarsInput";
import { RatingStarsReadonly } from "./RatingStarsReadonly";

type LoadState = "idle" | "loading" | "error";

type PostErrorJson = {
  error?: string;
  code?: string;
};

export function CollaborationRatingPanel({
  offerId,
  offerStatus,
}: {
  offerId: string;
  offerStatus: OfferStatus;
}) {
  const router = useRouter();
  const hasLoadedOnce = useRef(false);

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [data, setData] = useState<CollaborationRatingGetResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorKind, setSubmitErrorKind] = useState<
    "duplicate" | "invalid" | "unauthorized" | "forbidden" | "other" | null
  >(null);
  const [successFlash, setSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRating = useCallback(async () => {
    setLoadError(null);
    if (!hasLoadedOnce.current) {
      setLoadState("loading");
    }
    try {
      const res = await fetch(`/api/offers/${encodeURIComponent(offerId)}/rating`, { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | CollaborationRatingGetResponse
        | { error?: string }
        | null;

      if (res.status === 401) {
        setLoadError("Oturum bulunamadı. Sayfayı yenileyip tekrar giriş yapın.");
        setData(null);
        setLoadState("error");
        return;
      }
      if (res.status === 403) {
        setLoadError("Bu teklifin puan bilgisini görüntüleme yetkiniz yok.");
        setData(null);
        setLoadState("error");
        return;
      }
      if (!res.ok || !json || !("ok" in json) || json.ok !== true) {
        const msg =
          json && typeof json === "object" && "error" in json && typeof json.error === "string"
            ? json.error
            : "Puan bilgisi alınamadı.";
        setLoadError(msg);
        setData(null);
        setLoadState("error");
        return;
      }

      setData(json);
      hasLoadedOnce.current = true;
      setLoadState("idle");
    } catch {
      setLoadError("Bağlantı hatası.");
      setData(null);
      setLoadState("error");
    }
  }, [offerId]);

  useEffect(() => {
    if (offerStatus !== "COMPLETED") {
      setLoadState("idle");
      setData(null);
      hasLoadedOnce.current = false;
      return;
    }
    void fetchRating();
  }, [offerStatus, offerId, fetchRating]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected == null || submitting || !data?.eligible) return;
    setSubmitting(true);
    setSubmitError(null);
    setSubmitErrorKind(null);
    setSuccessFlash(false);
    setSuccessMessage(null);
    try {
      const res = await fetch(`/api/offers/${encodeURIComponent(offerId)}/rating`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selected }),
      });
      const json = (await res.json().catch(() => ({}))) as
        | CollaborationRatingPostSuccessResponse
        | PostErrorJson
        | Record<string, unknown>;

      if (res.status === 401) {
        setSubmitError("Oturum süresi doldu. Tekrar giriş yapın.");
        setSubmitErrorKind("unauthorized");
        return;
      }
      if (res.status === 403) {
        setSubmitError("Bu işlem için yetkiniz yok.");
        setSubmitErrorKind("forbidden");
        return;
      }
      if (
        res.status === 409 ||
        ("code" in json && json.code === "DUPLICATE_RATING")
      ) {
        setSubmitError("Bu iş birliği için zaten puan verdiniz.");
        setSubmitErrorKind("duplicate");
        await fetchRating();
        return;
      }
      if (res.status === 400) {
        const err = json as PostErrorJson;
        setSubmitError(
          typeof err.error === "string" ? err.error : "Puan gönderilemedi.",
        );
        setSubmitErrorKind(err.code === "INVALID_STATE" ? "invalid" : "other");
        return;
      }
      if (
        !res.ok ||
        !("success" in json) ||
        json.success !== true ||
        !("rating" in json)
      ) {
        const err = json as PostErrorJson;
        setSubmitError(
          typeof err.error === "string" ? err.error : "Puan gönderilemedi.",
        );
        setSubmitErrorKind("other");
        return;
      }

      const ok = json as CollaborationRatingPostSuccessResponse;
      setSuccessMessage(ok.message ?? "Puanınız kaydedildi.");
      setSelected(null);
      setSuccessFlash(true);
      window.setTimeout(() => {
        setSuccessFlash(false);
        setSuccessMessage(null);
      }, 5000);
      await fetchRating();
      router.refresh();
    } catch {
      setSubmitError("Bağlantı hatası.");
      setSubmitErrorKind("other");
    } finally {
      setSubmitting(false);
    }
  }

  if (offerStatus !== "COMPLETED") {
    return null;
  }

  if (loadState === "loading" && !data) {
    return (
      <section
        className="chat-panel chat-panel--collaboration-rating"
        aria-labelledby="chat-collab-rating-heading"
      >
        <h3 id="chat-collab-rating-heading" className="chat-panel__section-title">
          İş birliği puanı
        </h3>
        <div aria-hidden className="collab-rating-panel__skeleton">
          <div className="skeleton skeleton-line" style={{ maxWidth: "60%" }} />
          <div className="skeleton skeleton-line skeleton-line--short" />
        </div>
      </section>
    );
  }

  if (loadState === "error" && loadError) {
    return (
      <section
        className="chat-panel chat-panel--collaboration-rating"
        aria-labelledby="chat-collab-rating-heading"
      >
        <h3 id="chat-collab-rating-heading" className="chat-panel__section-title">
          İş birliği puanı
        </h3>
        <p className="alert-inline alert-inline--error" role="alert">
          {loadError}
        </p>
      </section>
    );
  }

  if (!data || !data.eligible) {
    return null;
  }

  const { mine, theirs, ratingState } = data;
  const showForm = !mine.submitted || mine.rating == null;

  return (
    <section
      className="chat-panel chat-panel--collaboration-rating collab-rating-panel"
      aria-labelledby="chat-collab-rating-heading"
    >
      <h3 id="chat-collab-rating-heading" className="chat-panel__section-title">
        İş birliği puanı
      </h3>
      <p className="chat-panel__section-hint muted">
        Tamamlanan iş birliğinde yalnızca karşı tarafa 1–5 yıldız verirsiniz (yorum bu adımda yok).
      </p>

      {successFlash && successMessage ? (
        <p className="collab-rating-panel__success" role="status" aria-live="polite">
          {successMessage}
        </p>
      ) : null}

      {!showForm && mine.rating != null ? (
        <div className="collab-rating-panel__block collab-rating-panel__block--done">
          <p className="collab-rating-panel__label muted">Verdiğiniz puan</p>
          <div className="collab-rating-panel__row">
            <div className="collab-rating-panel__score-readout" aria-label={`Verdiğiniz puan: ${mine.rating} üzerinden 5`}>
              <span className="collab-rating-panel__score-num">{mine.rating}</span>
              <span className="collab-rating-panel__score-max">/ 5</span>
              <RatingStarsReadonly rating={mine.rating} label={`${mine.rating} yıldız`} />
            </div>
            <span className="collab-rating-panel__badge">Puan verildi</span>
          </div>
        </div>
      ) : (
        <form
          className="collab-rating-panel__form"
          onSubmit={(e) => void handleSubmit(e)}
          aria-busy={submitting}
        >
          <p className="collab-rating-panel__label muted" id="collab-rating-form-label">
            Karşı tarafı puanlayın
          </p>
          <div aria-labelledby="collab-rating-form-label">
            <RatingStarsInput
              value={selected}
              onChange={setSelected}
              disabled={submitting}
              idPrefix={`offer-${offerId}-rating`}
            />
          </div>
          {selected != null ? (
            <p className="collab-rating-panel__selected-preview" aria-live="polite">
              Seçilen puan: <strong>{selected}</strong> / 5
            </p>
          ) : (
            <p className="collab-rating-panel__selected-preview collab-rating-panel__selected-preview--placeholder muted">
              1–5 arası bir puan seçin.
            </p>
          )}
          <div className="collab-rating-panel__actions">
            <button
              type="submit"
              className="btn btn--sm"
              disabled={selected == null || submitting}
            >
              {submitting ? "Gönderiliyor…" : "Puanı gönder"}
            </button>
          </div>
        </form>
      )}

      {theirs.submitted && theirs.rating != null ? (
        <div className="collab-rating-panel__theirs">
          <p className="muted collab-rating-panel__theirs-text">
            <span className="collab-rating-panel__theirs-stars" aria-hidden>
              <RatingStarsReadonly rating={theirs.rating} size="sm" />
            </span>
            Karşı taraf size <strong>{theirs.rating}</strong> yıldız verdi.
          </p>
        </div>
      ) : null}

      {ratingState === "both" ? (
        <p className="muted collab-rating-panel__state-hint">Her iki taraf da puan verdi.</p>
      ) : ratingState === "neither" ? (
        <p className="muted collab-rating-panel__state-hint collab-rating-panel__state-hint--subtle">
          Henüz kimse puanlamadı. İlk puanı siz verebilirsiniz.
        </p>
      ) : ratingState === "mine_only" ? (
        <p className="muted collab-rating-panel__state-hint collab-rating-panel__state-hint--subtle">
          Karşı taraf henüz puan vermedi.
        </p>
      ) : ratingState === "theirs_only" ? (
        <p className="muted collab-rating-panel__state-hint collab-rating-panel__state-hint--subtle">
          Siz henüz puan vermediniz.
        </p>
      ) : null}

      {submitError ? (
        <p className="alert-inline alert-inline--error collab-rating-panel__submit-err" role="alert">
          {submitError}
          {submitErrorKind === "duplicate" ? " Güncel durum yüklendi." : ""}
        </p>
      ) : null}
    </section>
  );
}
