"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { CollaborationMediaKind, DeliveryStatus, OfferStatus } from "@prisma/client";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphInbox } from "@/components/icons/emptyStateGlyphs";
import { normalizeDeliveryUrlField } from "@/lib/offers/deliveryPayload";
import {
  DELIVERY_MEDIA_MAX_FILES,
  DELIVERY_VIDEO_MAX_BYTES,
  deliveryImageTooLargeMessage,
  deliveryVideoTooLargeMessage,
} from "@/lib/offers/deliverySubmitConstants";
import { COLLAB_IMAGE_MAX_BYTES } from "@/lib/uploads/collabMediaLimits";
import { StatusBadge } from "./StatusBadge";

type DeliveryMediaRow = {
  id: string;
  kind: CollaborationMediaKind;
  mimeType: string;
  sizeBytes: number;
  originalFilenameSafe: string | null;
  createdAt: string;
  url: string;
};

type DeliveryRow = {
  id: string;
  deliveryUrl: string | null;
  deliveryText: string | null;
  status: DeliveryStatus;
  createdAt: string;
  submittedBy: { id: string; name: string };
  media: DeliveryMediaRow[];
};

const DELIVERY_STATUS_TR: Record<DeliveryStatus, string> = {
  SUBMITTED: "Gönderildi",
  APPROVED: "Onaylandı",
  REVISION_REQUESTED: "Revize istendi",
};

const ACCEPT_MIME =
  "image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm";

function timelineItemClass(status: DeliveryStatus): string {
  if (status === "APPROVED") return "chat-delivery-timeline__item chat-delivery-timeline__item--approved";
  if (status === "REVISION_REQUESTED") {
    return "chat-delivery-timeline__item chat-delivery-timeline__item--revision";
  }
  return "chat-delivery-timeline__item chat-delivery-timeline__item--submitted";
}

function timelineBadgeClass(status: DeliveryStatus): string {
  const base = "chat-delivery-timeline__badge";
  if (status === "APPROVED") return `${base} chat-delivery-timeline__badge--approved`;
  if (status === "REVISION_REQUESTED") return `${base} chat-delivery-timeline__badge--revision`;
  return `${base} chat-delivery-timeline__badge--submitted`;
}

function preview(s: string | null, max = 72): string {
  if (!s?.trim()) return "—";
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function isLikelyVideoFile(file: Pick<File, "type" | "name">): boolean {
  if (file.type.startsWith("video/")) return true;
  return /\.(mp4|mov|webm)$/i.test(file.name);
}

type DeliveryApiErr = { error?: string; code?: string };

function messageForDeliverySubmitFailure(
  res: Response,
  data: DeliveryApiErr,
  rawBody?: string,
): string {
  const body = rawBody ?? "";
  if (res.status === 413 || /413|entity too large|payload too large|request entity too large/i.test(body)) {
    return deliveryVideoTooLargeMessage();
  }
  if (res.status === 408 || res.status === 504) {
    return "Sunucu yanit vermedi veya zaman asimi. Tekrar deneyin.";
  }

  const e = typeof data.error === "string" ? data.error.trim() : "";
  if (e) return e;

  switch (data.code) {
    case "DELIVERY_FILE_TOO_LARGE":
      return deliveryVideoTooLargeMessage();
    case "DELIVERY_FILE_UNSUPPORTED":
      return "Desteklenmeyen dosya turu (JPEG, PNG, WebP, MP4, MOV, WebM).";
    case "DELIVERY_UPLOAD_INTERRUPTED":
      return "Dosya aktarimi yarıda kaldi veya kesildi. Tekrar deneyin.";
    case "DELIVERY_PROCESS_FAILED":
      return "Sunucuda islem tamamlanamadi. Lutfen tekrar deneyin.";
    case "DELIVERY_FORM_INVALID":
      return "Form verisi okunamadi. Baglantiyi kontrol edip tekrar deneyin.";
    case "DELIVERY_TEXT_INVALID":
      return "Teslim baglantisi veya not alaninda duzeltme gerekli.";
    default:
      break;
  }
  if (res.status >= 500) {
    return "Sunucuya ulasilamadi veya islem tamamlanamadi. Bir sure sonra tekrar deneyin.";
  }
  if (body.length > 0 && !body.trim().startsWith("{")) {
    return "Sunucu beklenmeyen bir yanit dondurdu (genelde gogde cok buyuk veya ara katman limiti). Videoyu kucultun veya tekrar deneyin.";
  }
  return "Teslim gonderilemedi. Tekrar deneyin.";
}

function DeliveryProofThumbnails({ media }: { media: DeliveryMediaRow[] }) {
  if (media.length === 0) return null;
  return (
    <div className="chat-delivery-media-strip" role="list">
      {media.map((m) => (
        <div key={m.id} className="chat-delivery-media-tile" role="listitem">
          <a
            className="chat-delivery-media-tile__link"
            href={m.url}
            target="_blank"
            rel="noreferrer"
            title={m.originalFilenameSafe ?? "Kanıt dosyası"}
          >
            {m.kind === "IMAGE" ? (
              <img className="chat-delivery-media-tile__img" src={m.url} alt="" loading="lazy" />
            ) : (
              <div className="chat-delivery-media-tile__video-wrap">
                <video
                  className="chat-delivery-media-tile__video"
                  src={m.url}
                  muted
                  playsInline
                  preload="metadata"
                  aria-label="Video önizleme"
                />
                <span className="chat-delivery-media-tile__video-badge">Video</span>
              </div>
            )}
          </a>
          <span className="chat-delivery-media-tile__meta muted">{formatBytes(m.sizeBytes)}</span>
        </div>
      ))}
    </div>
  );
}

function validateClientFile(file: File): string | null {
  if (file.size === 0) return "Bos dosya.";
  const likelyVideo = isLikelyVideoFile(file);
  const max = likelyVideo ? DELIVERY_VIDEO_MAX_BYTES : COLLAB_IMAGE_MAX_BYTES;
  if (file.size > max) {
    return likelyVideo ? deliveryVideoTooLargeMessage() : deliveryImageTooLargeMessage();
  }
  const okTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/quicktime",
    "video/webm",
  ]);
  if (file.type && !okTypes.has(file.type)) {
    return "Desteklenmeyen dosya turu (JPEG, PNG, WebP, MP4, MOV, WebM).";
  }
  return null;
}

export function DeliveryPanel({
  offerId,
  offerStatus,
  brandId,
  influencerId,
  meId,
}: {
  offerId: string;
  offerStatus: OfferStatus;
  brandId: string;
  influencerId: string;
  meId: string;
}) {
  const router = useRouter();
  const isInfluencer = influencerId === meId;
  const isBrand = brandId === meId;
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [deliveryUrl, setDeliveryUrl] = useState("");
  const [deliveryText, setDeliveryText] = useState("");
  const [staged, setStaged] = useState<{ key: string; file: File; previewUrl: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [reviewBusy, setReviewBusy] = useState<"APPROVE" | "REQUEST_REVISION" | null>(null);
  const busySubmit = useRef(false);

  const revokeStagedUrls = useCallback((items: { previewUrl: string }[]) => {
    for (const it of items) {
      try {
        URL.revokeObjectURL(it.previewUrl);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const stagedRef = useRef(staged);
  stagedRef.current = staged;
  useEffect(() => {
    return () => revokeStagedUrls(stagedRef.current);
  }, [revokeStagedUrls]);

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
      const list = Array.isArray(data.deliveries) ? data.deliveries : [];
      setDeliveries(
        list.map((d) => ({
          ...d,
          media: Array.isArray(d.media) ? d.media : [],
        })),
      );
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

  function removeStaged(key: string) {
    setStaged((prev) => {
      const found = prev.find((x) => x.key === key);
      if (found) revokeStagedUrls([found]);
      return prev.filter((x) => x.key !== key);
    });
  }

  function addFiles(fileList: FileList | File[]) {
    const incoming = Array.from(fileList);
    if (incoming.length === 0) return;
    const next: { key: string; file: File; previewUrl: string }[] = [];
    const skipped: string[] = [];
    for (const file of incoming) {
      if (staged.length + next.length >= DELIVERY_MEDIA_MAX_FILES) {
        skipped.push(`En fazla ${DELIVERY_MEDIA_MAX_FILES} dosya eklenebilir.`);
        break;
      }
      const v = validateClientFile(file);
      if (v) {
        skipped.push(`${file.name}: ${v}`);
        continue;
      }
      const previewUrl = URL.createObjectURL(file);
      next.push({ key: `${file.name}-${file.size}-${Math.random()}`, file, previewUrl });
    }
    if (next.length) setStaged((s) => [...s, ...next]);
    if (skipped.length) {
      setError(skipped[0] ?? "Dosya eklenemedi.");
    } else if (next.length) {
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const url = normalizeDeliveryUrlField(deliveryUrl);
    const note = deliveryText.trim();
    const files = staged.map((s) => s.file);
    if (!url && !note && files.length === 0) {
      setError("Teslim bağlantısı, not veya en az bir kanıt dosyası ekleyin.");
      return;
    }
    for (const f of files) {
      const v = validateClientFile(f);
      if (v) {
        setError(v);
        return;
      }
    }
    if (busySubmit.current || submitting) return;
    busySubmit.current = true;
    setSubmitting(true);
    setError(null);
    setFeedback(null);
    try {
      let res: Response;
      if (files.length > 0) {
        const fd = new FormData();
        fd.append("deliveryUrl", url);
        fd.append("deliveryText", note);
        for (const f of files) {
          fd.append("files", f);
        }
        res = await fetch(`/api/offers/${offerId}/deliveries`, {
          method: "POST",
          body: fd,
        });
      } else {
        res = await fetch(`/api/offers/${offerId}/deliveries`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...(url ? { deliveryUrl: url } : {}),
            ...(note ? { deliveryText: note } : {}),
          }),
        });
      }
      const rawText = await res.text();
      let data: DeliveryApiErr = {};
      try {
        data = JSON.parse(rawText) as DeliveryApiErr;
      } catch {
        /* HTML veya bos govde */
      }
      if (!res.ok) {
        setError(messageForDeliverySubmitFailure(res, data, rawText));
        return;
      }
      revokeStagedUrls(staged);
      setStaged([]);
      setDeliveryUrl("");
      setDeliveryText("");
      setFeedback("Teslim başarıyla gönderildi.");
      await loadDeliveries();
      router.refresh();
    } catch {
      setError("Baglanti kesildi veya zaman asimi. Tekrar deneyin.");
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

  const showSubmit =
    isInfluencer && (offerStatus === "IN_PROGRESS" || offerStatus === "REVISION_REQUESTED");
  const showReview =
    isBrand && offerStatus === "DELIVERED" && Boolean(pendingReview);

  const latestDelivery = deliveries.length > 0 ? deliveries[0] : null;

  function snapshotPillClass(status: DeliveryStatus): string {
    if (status === "APPROVED") return "chat-delivery-snapshot__pill chat-delivery-snapshot__pill--approved";
    if (status === "REVISION_REQUESTED") {
      return "chat-delivery-snapshot__pill chat-delivery-snapshot__pill--revision";
    }
    return "chat-delivery-snapshot__pill chat-delivery-snapshot__pill--submitted";
  }

  return (
    <section className="chat-panel chat-panel--delivery" aria-labelledby="chat-delivery-heading">
      <div className="chat-delivery-intro">
        <div className="chat-delivery-intro__head">
          <span className="chat-delivery-intro__eyebrow">Teslimat</span>
          <div className="chat-delivery-intro__title-row">
            <h3 id="chat-delivery-heading" className="chat-delivery-intro__title">
              Teslimat ve inceleme
            </h3>
            <StatusBadge status={offerStatus} />
          </div>
        </div>
        <p className="chat-delivery-intro__lede muted">
          Bağlantı, not ve isteğe bağlı dosya yükleyerek kalıcı kanıt paylaşın; marka inceleyip onaylar veya revize
          talep eder. Geçmiş kayıtlar aşağıda listelenir.
        </p>
      </div>

      {!loading && offerStatus === "REVISION_REQUESTED" && isInfluencer && (
        <div className="chat-revision-callout" role="status">
          <p className="chat-revision-callout__title">Revize istendi</p>
          <p className="chat-revision-callout__body muted">
            Marka son teslimi inceledi ve yeni bir sürüm bekliyor. Aşağıdan güncellenmiş bağlantı, not veya dosya
            gönderin. Önceki teslimdeki dosyalar geçmişte görünmeye devam eder.
          </p>
        </div>
      )}

      {!loading && latestDelivery && (
        <div className="chat-delivery-snapshot" aria-live="polite">
          <span className="chat-delivery-snapshot__label">Son teslim</span>
          <span className={snapshotPillClass(latestDelivery.status)}>
            {DELIVERY_STATUS_TR[latestDelivery.status] ?? latestDelivery.status}
          </span>
          <time className="chat-delivery-snapshot__time" dateTime={latestDelivery.createdAt}>
            {new Date(latestDelivery.createdAt).toLocaleString("tr-TR")}
          </time>
        </div>
      )}

      {loading && (
        <div className="chat-delivery-skeleton" aria-hidden>
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-line skeleton-line--short" />
        </div>
      )}
      {error && <p className="alert-inline alert-inline--error chat-delivery-alert">{error}</p>}
      {feedback && <p className="alert-inline alert-inline--success chat-delivery-alert">{feedback}</p>}

      {!loading && showSubmit && (
        <div className="chat-delivery-block chat-delivery-block--form">
          <h4 className="chat-delivery-block__heading">Yeni teslim gönder</h4>
          <form className="chat-delivery-form" onSubmit={handleSubmit}>
            <div className="chat-delivery-field">
              <label className="chat-delivery-label" htmlFor={`${formId}-delivery-url`}>
                Teslim bağlantısı
              </label>
              <input
                id={`${formId}-delivery-url`}
                className="chat-delivery-input"
                type="text"
                inputMode="url"
                value={deliveryUrl}
                onChange={(e) => setDeliveryUrl(e.target.value)}
                disabled={submitting}
                placeholder="https://... (isteğe bağlı)"
                autoComplete="off"
              />
              <p className="chat-delivery-field-hint muted">
                Örn. story linki; süresi dolabilir — yanına mutlaka ekran görüntüsü veya video yüklemeniz önerilir.
              </p>
            </div>
            <div className="chat-delivery-field">
              <label className="chat-delivery-label" htmlFor={`${formId}-delivery-note`}>
                Teslim notu
              </label>
              <textarea
                id={`${formId}-delivery-note`}
                className="chat-delivery-textarea"
                value={deliveryText}
                onChange={(e) => setDeliveryText(e.target.value)}
                disabled={submitting}
                rows={3}
                placeholder="Kısa açıklama (isteğe bağlı)"
              />
            </div>

            <div className="chat-delivery-field">
              <span className="chat-delivery-label" id={`${formId}-upload-label`}>
                Kanıt dosyaları
              </span>
              <div
                className={`chat-delivery-upload${dragActive ? " chat-delivery-upload--drag" : ""}`}
                role="group"
                aria-labelledby={`${formId}-upload-label`}
                onDragEnter={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "copy";
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  if (e.currentTarget === e.target) setDragActive(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragActive(false);
                  if (submitting) return;
                  addFiles(e.dataTransfer.files);
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="chat-delivery-upload__input"
                  accept={ACCEPT_MIME}
                  multiple
                  disabled={submitting}
                  aria-label="Dosya seç"
                  onChange={(ev) => {
                    const fl = ev.target.files;
                    if (fl?.length) addFiles(fl);
                    ev.target.value = "";
                  }}
                />
                <div className="chat-delivery-upload__inner">
                  <span className="chat-delivery-upload__icon" aria-hidden>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12 16V4m0 0l4 4m-4-4L8 8"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M4 14v4a2 2 0 002 2h12a2 2 0 002-2v-4"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                  <p className="chat-delivery-upload__title">
                    {staged.length === 0
                      ? "Dosya sürükleyip bırakın veya seçin"
                      : `${staged.length} dosya forma eklendi (henüz gönderilmedi)`}
                  </p>
                  <p className="chat-delivery-upload__hint muted">
                    Görsel: JPEG, PNG, WebP · en fazla 10 MB. Video: MP4, MOV, WebM · şimdilik en fazla 200 MB (daha
                    büyük ve kesintisiz yükleme yakında). Tek seferde en fazla {DELIVERY_MEDIA_MAX_FILES} dosya.
                  </p>
                  <p className="chat-delivery-upload__hint chat-delivery-upload__hint--sub muted">
                    Seçtikten sonra dosyalar cihazınızda kalır; sunucuya yalnızca «Teslimi gönder» ile yüklenir.
                  </p>
                  <button
                    type="button"
                    className="btn secondary chat-delivery-upload__browse"
                    disabled={submitting}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Dosya seç
                  </button>
                </div>
              </div>

              {staged.length > 0 && (
                <ul className="chat-delivery-staged-list" aria-label="Seçilen dosyalar">
                  <li className="chat-delivery-staged-preamble">
                    <span className="muted">
                      Önizleme — bu dosyalar sunucuya aktarılmadı. Gönderim bitene kadar «başarılı» sayılmaz.
                    </span>
                  </li>
                  {staged.map((s) => (
                    <li key={s.key} className="chat-delivery-staged-item">
                      <div className="chat-delivery-staged-thumb">
                        {isLikelyVideoFile(s.file) ? (
                          <video className="chat-delivery-staged-thumb__media" src={s.previewUrl} muted playsInline />
                        ) : (
                          <img className="chat-delivery-staged-thumb__media" src={s.previewUrl} alt="" />
                        )}
                      </div>
                      <div className="chat-delivery-staged-meta">
                        <span className="chat-delivery-staged-name">{s.file.name}</span>
                        <span className="chat-delivery-staged-size-row">
                          <span className="chat-delivery-staged-size">{formatBytes(s.file.size)}</span>
                          {isLikelyVideoFile(s.file) && s.file.size > DELIVERY_VIDEO_MAX_BYTES * 0.85 ? (
                            <span className="chat-delivery-staged-size-warn muted">Yakın sınır</span>
                          ) : null}
                        </span>
                      </div>
                      <button
                        type="button"
                        className="chat-delivery-staged-remove"
                        disabled={submitting}
                        onClick={() => removeStaged(s.key)}
                        aria-label={`${s.file.name} dosyasını kaldır`}
                      >
                        Kaldır
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="chat-delivery-form-actions">
              <button className="btn chat-delivery-submit" type="submit" disabled={submitting}>
                {submitting
                  ? staged.length > 0
                    ? "Dosyalar yükleniyor, teslim kaydediliyor…"
                    : "Gönderiliyor…"
                  : "Teslimi gönder"}
              </button>
            </div>
          </form>
        </div>
      )}

      {!loading && !showSubmit && showReview && pendingReview && (
        <div className="chat-delivery-block chat-delivery-review chat-delivery-review--brand-pending">
          <div className="chat-delivery-review__head">
            <h4 className="chat-delivery-review__title">Marka incelemesi</h4>
            <p className="chat-delivery-review__subtitle muted">
              Son gönderilen teslimi inceleyin; onay veya revize seçin.
            </p>
          </div>
          <div className="chat-delivery-review__body">
            {pendingReview.deliveryUrl && (
              <div className="chat-delivery-review__chunk">
                <span className="chat-delivery-review__k">Bağlantı</span>
                <a
                  className="chat-delivery-review__link"
                  href={pendingReview.deliveryUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  {preview(pendingReview.deliveryUrl, 80)}
                </a>
              </div>
            )}
            {pendingReview.deliveryText && (
              <div className="chat-delivery-review__chunk">
                <span className="chat-delivery-review__k">Not</span>
                <p className="chat-delivery-review__text">{preview(pendingReview.deliveryText, 200)}</p>
              </div>
            )}
            {pendingReview.media.length > 0 && (
              <div className="chat-delivery-review__chunk">
                <span className="chat-delivery-review__k">Yüklenen kanıt</span>
                <DeliveryProofThumbnails media={pendingReview.media} />
              </div>
            )}
            <p className="chat-delivery-review__meta muted">
              {pendingReview.submittedBy.name} · {new Date(pendingReview.createdAt).toLocaleString("tr-TR")}
            </p>
          </div>
          <div className="chat-delivery-actions chat-delivery-actions--stack">
            <button
              type="button"
              className="btn btn--success chat-delivery-actions__primary"
              disabled={reviewBusy !== null}
              onClick={() => void handleReview("APPROVE")}
            >
              {reviewBusy === "APPROVE" ? "…" : "Teslimi onayla"}
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
              icon={<EmptyGlyphInbox />}
              title="Henüz teslim kaydı yok"
              description="Teslim gönderildiğinde veya geçmiş oluştuğunda burada görünür."
            />
          </div>
        )}

      {!loading && deliveries.length > 0 && (
        <div className="chat-delivery-block chat-delivery-block--timeline">
          <div className="chat-delivery-timeline__head">
            <h4 className="chat-delivery-timeline__title">Teslim geçmişi</h4>
            <p className="chat-delivery-timeline__lede muted">Onaylanan ve önceki sürümler.</p>
          </div>
          <ul className="chat-delivery-timeline__list" role="list">
            {deliveries.map((d) => (
              <li key={d.id} className={timelineItemClass(d.status)}>
                <div className="chat-delivery-timeline__card-top">
                  <span className={timelineBadgeClass(d.status)}>{DELIVERY_STATUS_TR[d.status] ?? d.status}</span>
                  <time className="chat-delivery-timeline__time" dateTime={d.createdAt}>
                    {new Date(d.createdAt).toLocaleString("tr-TR")}
                  </time>
                </div>
                <p className="chat-delivery-timeline__byline">
                  <span className="chat-delivery-timeline__byline-label">Gönderen</span>
                  <span className="chat-delivery-timeline__byline-name">{d.submittedBy.name}</span>
                </p>
                {d.status === "REVISION_REQUESTED" ? (
                  <p className="chat-delivery-timeline__state-callout" role="note">
                    Bu kayıt revize ile sonuçlandı; güncel teslim için yeni gönderim gerekir.
                  </p>
                ) : null}
                {d.deliveryUrl ? (
                  <div className="chat-delivery-timeline__field">
                    <span className="chat-delivery-timeline__k">Bağlantı</span>
                    <a
                      href={d.deliveryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="chat-delivery-timeline__link-chip"
                      title={d.deliveryUrl}
                    >
                      {preview(d.deliveryUrl, 96)}
                    </a>
                  </div>
                ) : null}
                {d.deliveryText ? (
                  <div className="chat-delivery-timeline__field">
                    <span className="chat-delivery-timeline__k">Not</span>
                    <div className="chat-delivery-timeline__note">{d.deliveryText}</div>
                  </div>
                ) : null}
                {!d.deliveryUrl && !d.deliveryText && d.media.length > 0 ? (
                  <div className="chat-delivery-timeline__field">
                    <span className="chat-delivery-timeline__k">İçerik</span>
                    <p className="chat-delivery-timeline__files-only">Yalnızca dosya yüklendi; bağlantı veya not yok.</p>
                  </div>
                ) : null}
                {d.media.length > 0 ? (
                  <div className="chat-delivery-timeline__field chat-delivery-timeline__field--media">
                    <span className="chat-delivery-timeline__k">Kanıt dosyaları</span>
                    <div className="chat-delivery-timeline__media-shell">
                      <DeliveryProofThumbnails media={d.media} />
                    </div>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
