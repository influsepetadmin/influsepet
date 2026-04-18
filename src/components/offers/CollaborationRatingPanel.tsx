"use client";

import type { OfferStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  COLLABORATION_RATING_REVIEW_TEXT_MAX,
  type CollaborationRatingGetResponse,
  type CollaborationRatingPostSuccessResponse,
} from "@/lib/offers/collaborationRating";
import { RatingStarsInput } from "./RatingStarsInput";
import { RatingStarsReadonly } from "./RatingStarsReadonly";

type LoadState = "idle" | "loading" | "error";

type PostErrorJson = {
  error?: string;
  code?: string;
};

function isCollaborationRatingGetPayload(
  json: unknown,
): json is CollaborationRatingGetResponse {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  if (o.ok !== true) return false;
  if (typeof o.offerId !== "string") return false;
  if (!o.mine || typeof o.mine !== "object") return false;
  if (!o.theirs || typeof o.theirs !== "object") return false;
  return true;
}

function errorMessageFromJson(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const o = json as Record<string, unknown>;
  if (typeof o.error === "string" && o.error.trim()) return o.error;
  if (typeof o.message === "string" && o.message.trim()) return o.message;
  return fallback;
}

export function CollaborationRatingPanel({
  offerId,
  offerStatus,
  /** Incremented after each successful chat message load while completed — keeps "their" rating in sync. */
  chatActivityEpoch,
}: {
  offerId: string;
  offerStatus: OfferStatus;
  chatActivityEpoch?: number;
}) {
  const router = useRouter();
  const hasLoadedOnce = useRef(false);
  /** Supersedes in-flight fetches so an older request cannot overwrite a newer successful response. */
  const fetchGenerationRef = useRef(0);
  const noteFieldId = useId();

  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [data, setData] = useState<CollaborationRatingGetResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selected, setSelected] = useState<number | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorKind, setSubmitErrorKind] = useState<
    "duplicate" | "invalid" | "unauthorized" | "forbidden" | "other" | null
  >(null);
  const [successFlash, setSuccessFlash] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchRating = useCallback(async () => {
    const gen = ++fetchGenerationRef.current;
    setLoadError(null);
    if (!hasLoadedOnce.current) {
      setLoadState("loading");
    }
    try {
      const res = await fetch(`/api/offers/${encodeURIComponent(offerId)}/rating`, {
        cache: "no-store",
        credentials: "include",
      });
      const json = (await res.json().catch(() => null)) as
        | CollaborationRatingGetResponse
        | { error?: string; message?: string }
        | null;

      if (gen !== fetchGenerationRef.current) return;

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

      if (res.ok && isCollaborationRatingGetPayload(json)) {
        setData(json);
        hasLoadedOnce.current = true;
        setLoadState("idle");
        return;
      }

      const msg = errorMessageFromJson(json, "Puan bilgisi alınamadı.");
      setLoadError(msg);
      setData(null);
      setLoadState("error");
    } catch {
      if (gen !== fetchGenerationRef.current) return;
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

  /**
   * Counterparty may submit after this panel loaded. Initial fetch only ran on mount / offer change,
   * so without refetch the other side's rating stayed stale in React state until full page reload.
   */
  useEffect(() => {
    if (offerStatus !== "COMPLETED") return;
    const refetch = () => {
      void fetchRating();
    };
    const onVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    window.addEventListener("online", refetch);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("online", refetch);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [offerStatus, fetchRating]);

  useEffect(() => {
    if (offerStatus !== "COMPLETED") return;
    if (chatActivityEpoch === undefined || chatActivityEpoch < 1) return;
    void fetchRating();
  }, [chatActivityEpoch, offerStatus, fetchRating]);

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
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: selected, reviewText: reviewNote }),
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
      setReviewNote("");
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
          Değerlendirme
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
          Değerlendirme
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
        Değerlendirme
      </h3>
      <p className="chat-panel__section-hint muted">
        Tamamlanan iş birliğinde karşı tarafı 1–5 yıldız ile puanlayın. İsterseniz en fazla{" "}
        {COLLABORATION_RATING_REVIEW_TEXT_MAX} karakterlik isteğe bağlı kısa yorum da ekleyebilirsiniz.
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
          {mine.reviewText?.trim() ? (
            <div className="collab-rating-panel__my-note">
              <p className="collab-rating-panel__label muted">Yorumunuz</p>
              <p className="collab-rating-panel__review-text-body">{mine.reviewText}</p>
            </div>
          ) : null}
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
          <div className="collab-rating-panel__optional-note">
            <label className="collab-rating-panel__optional-note-label muted" htmlFor={noteFieldId}>
              Kısa yorum (isteğe bağlı)
            </label>
            <textarea
              id={noteFieldId}
              className="collab-rating-panel__textarea"
              value={reviewNote}
              onChange={(e) =>
                setReviewNote(e.target.value.slice(0, COLLABORATION_RATING_REVIEW_TEXT_MAX))
              }
              disabled={submitting}
              rows={2}
              maxLength={COLLABORATION_RATING_REVIEW_TEXT_MAX}
              placeholder="Örn. iletişim, teslim veya iş birliği süreci hakkında birkaç kelime…"
              autoComplete="off"
              aria-describedby={`${noteFieldId}-count`}
            />
            <p
              id={`${noteFieldId}-count`}
              className="collab-rating-panel__char-count muted"
              aria-live="polite"
            >
              {reviewNote.length} / {COLLABORATION_RATING_REVIEW_TEXT_MAX}
            </p>
          </div>
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
          {theirs.reviewText?.trim() ? (
            <div className="collab-rating-panel__theirs-note" role="note">
              <span className="collab-rating-panel__theirs-note-label muted">Karşı tarafın yorumu</span>
              <p className="collab-rating-panel__theirs-note-body">{theirs.reviewText}</p>
            </div>
          ) : null}
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
