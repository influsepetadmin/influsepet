"use client";

import type { OfferStatus } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphChatBubble } from "@/components/icons/emptyStateGlyphs";
import { CollaborationRatingPanel } from "@/components/offers/CollaborationRatingPanel";
import { DeliveryPanel } from "@/components/offers/DeliveryPanel";
import { StatusBadge } from "@/components/offers/StatusBadge";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { formatWorkflowEventBody, getChatThreadPresentation } from "@/lib/chat/chatThreadMessagePresentation";

const WORKFLOW_EVENT_ICON_PX = 12;
const WORKFLOW_EVENT_ICON_STROKE = 1.65;

type Msg = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  kind: "TEXT" | "MEDIA";
  isDelivered: boolean;
  isSeen: boolean;
  media: {
    id: string;
    kind: "IMAGE" | "VIDEO";
    mimeType: string;
    sizeBytes: number;
    url: string;
  } | null;
};

function uploadCollaborationMedia(
  formData: FormData,
  onProgress: (percent: number) => void,
): Promise<{ ok?: boolean; error?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/chat/media/upload");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && e.total > 0) {
        onProgress(Math.min(100, Math.round((100 * e.loaded) / e.total)));
      }
    };
    xhr.onload = () => {
      try {
        const data = JSON.parse(xhr.responseText || "{}") as { ok?: boolean; error?: string };
        if (xhr.status >= 200 && xhr.status < 300 && data.ok) {
          resolve({ ok: true });
        } else {
          resolve({ error: data.error ?? "Yukleme basarisiz." });
        }
      } catch {
        resolve({ error: "Yanit cozumlenemedi." });
      }
    };
    xhr.onerror = () => resolve({ error: "Baglanti hatasi." });
    xhr.send(formData);
  });
}

const CHAT_QUICK_EMOJIS = [
  "😊",
  "👍",
  "❤️",
  "😂",
  "🙏",
  "👏",
  "🔥",
  "✨",
  "😉",
  "🎉",
  "💬",
  "✅",
  "❌",
  "🤔",
  "😍",
  "🙌",
  "💯",
  "👋",
  "🌟",
] as const;

function TickCheck() {
  return (
    <svg width="12" height="11" viewBox="0 0 14 12" className="chat-ticks-svg chat-ticks-svg--unit" aria-hidden>
      <path
        d="M1.5 6.2 L5.2 9.8 L12.5 2"
        stroke="currentColor"
        strokeWidth="1.75"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function OutgoingMessageTicks({
  isDelivered,
  isSeen,
}: {
  isDelivered: boolean;
  isSeen: boolean;
}) {
  if (!isDelivered) {
    return (
      <span className="chat-ticks-pair chat-ticks-pair--pending" aria-hidden>
        <TickCheck />
      </span>
    );
  }

  return (
    <span
      className={`chat-ticks-pair ${isSeen ? "chat-ticks-pair--seen" : "chat-ticks-pair--delivered"}`}
      aria-hidden
    >
      <span className="chat-ticks-double">
        <TickCheck />
        <TickCheck />
      </span>
    </span>
  );
}

function formatMsgTime(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function sameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

function dayBucketKey(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  } catch {
    return "";
  }
}

function formatDaySeparatorLabel(iso: string): string {
  try {
    const d = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (sameCalendarDay(d, today)) return "Bugün";
    if (sameCalendarDay(d, yesterday)) return "Dün";
    return d.toLocaleDateString("tr-TR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

type ThreadItem =
  | { kind: "day"; key: string; label: string }
  | { kind: "message"; message: Msg };

function buildThreadItems(messages: Msg[]): ThreadItem[] {
  const out: ThreadItem[] = [];
  let lastKey = "";
  for (const m of messages) {
    const dk = dayBucketKey(m.createdAt);
    if (dk && dk !== lastKey) {
      lastKey = dk;
      const label = formatDaySeparatorLabel(m.createdAt);
      if (label) out.push({ kind: "day", key: dk, label });
    }
    out.push({ kind: "message", message: m });
  }
  return out;
}

export default function ChatClient({
  conversationId,
  meId,
  offer,
  workflowMeta,
  chatContext,
}: {
  conversationId: string;
  meId: string;
  offer: {
    id: string;
    status: OfferStatus;
    brandId: string;
    influencerId: string;
    title: string | null;
    campaignName: string | null;
  };
  workflowMeta: {
    budgetLabel: string;
    createdAtLabel: string;
  };
  chatContext: {
    otherSideName: string;
    otherSideRole: string;
    otherSideAvatarSrc: string;
    otherSideHandleLine: string | null;
    profileHref: string;
    offerTitle: string;
  };
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [ratingChatEpoch, setRatingChatEpoch] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiPopoverRef = useRef<HTMLDivElement>(null);
  const seenInFlightRef = useRef(false);
  const chatLoadsRef = useRef(0);

  const load = useCallback(async () => {
    const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}`);
    const data = await res.json().catch(() => null);
    if (!data?.messages) return;
    const msgs = data.messages as Msg[];
    setMessages(msgs);
    chatLoadsRef.current += 1;
    /** After the first poll, bump epoch so CollaborationRatingPanel refetches (counterparty may have just rated). */
    if (offer.status === "COMPLETED" && chatLoadsRef.current >= 2) {
      setRatingChatEpoch((n) => n + 1);
    }

    const needsSeen = msgs.some((m) => m.senderId !== meId && !m.isSeen);
    if (!needsSeen || seenInFlightRef.current) return;

    seenInFlightRef.current = true;
    try {
      const seenRes = await fetch("/api/chat/messages/seen", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId }),
      });
      if (seenRes.ok) {
        setMessages((prev) =>
          prev.map((m) => (m.senderId !== meId && !m.isSeen ? { ...m, isSeen: true } : m)),
        );
      }
    } finally {
      seenInFlightRef.current = false;
    }
  }, [conversationId, meId, offer.status]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (!emojiOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = emojiPopoverRef.current;
      if (el && !el.contains(e.target as Node)) setEmojiOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [emojiOpen]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ conversationId, body: text }),
      });
      setBody("");
      await load();
    } finally {
      setSending(false);
    }
  }

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadErr(null);
    setUploading(true);
    setUploadPct(0);
    const fd = new FormData();
    fd.append("conversationId", conversationId);
    fd.append("file", file);
    const result = await uploadCollaborationMedia(fd, setUploadPct);
    setUploading(false);
    setUploadPct(0);
    e.target.value = "";
    if (result.error) {
      setUploadErr(result.error);
      return;
    }
    await load();
  }

  const lastOutgoingMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.senderId !== meId) continue;
      const pres = getChatThreadPresentation(m);
      if (pres.mode === "workflow-event" || pres.mode === "system-error") continue;
      return m.id;
    }
    return null;
  }, [messages, meId]);

  const threadItems = useMemo(() => buildThreadItems(messages), [messages]);

  return (
    <div className="chat-conversation">
      <header className="chat-workflow-card">
        <div className="chat-workflow-card__title-row">
          <div className="chat-workflow-card__title-block">
            <span className="chat-workflow-card__kicker">İş birliği</span>
            <h2 className="chat-workflow-card__title">{chatContext.offerTitle}</h2>
          </div>
          <div className="chat-workflow-card__title-aside">
            <StatusBadge status={offer.status} />
          </div>
        </div>

        <dl className="chat-workflow-card__metrics" aria-label="İş birliği özeti">
          <div className="chat-workflow-metric">
            <dt className="chat-workflow-metric__label">Bütçe</dt>
            <dd className="chat-workflow-metric__value">{workflowMeta.budgetLabel}</dd>
          </div>
          <div className="chat-workflow-metric">
            <dt className="chat-workflow-metric__label">Oluşturulma</dt>
            <dd className="chat-workflow-metric__value chat-workflow-metric__value--muted">
              {workflowMeta.createdAtLabel}
            </dd>
          </div>
          <div className="chat-workflow-metric">
            <dt className="chat-workflow-metric__label">Karşı taraf</dt>
            <dd className="chat-workflow-metric__value">{chatContext.otherSideName}</dd>
          </div>
        </dl>

        <div className="chat-workflow-card__identity">
          <div className="chat-workflow-card__avatar-wrap" aria-hidden>
            <div className="chat-workflow-card__avatar-ring">
              <img
                className="chat-workflow-card__avatar"
                src={chatContext.otherSideAvatarSrc}
                alt=""
                width={44}
                height={44}
              />
            </div>
          </div>
          <div className="chat-workflow-card__identity-main">
            <span className="chat-workflow-card__identity-role">{chatContext.otherSideRole}</span>
            <span className="chat-workflow-card__identity-name">{chatContext.otherSideName}</span>
            {chatContext.otherSideHandleLine ? (
              <span className="chat-workflow-card__identity-handle muted">{chatContext.otherSideHandleLine}</span>
            ) : null}
          </div>
          <Link className="btn secondary btn--sm chat-workflow-card__profile-btn" href={chatContext.profileHref}>
            Profili görüntüle
          </Link>
        </div>
      </header>

      <DeliveryPanel
        offerId={offer.id}
        offerStatus={offer.status}
        brandId={offer.brandId}
        influencerId={offer.influencerId}
        meId={meId}
      />
      <CollaborationRatingPanel
        offerId={offer.id}
        offerStatus={offer.status}
        chatActivityEpoch={ratingChatEpoch}
      />

      <div className="chat-thread chat-thread--premium">
        {messages.length === 0 ? (
          <div className="chat-thread-empty">
            <EmptyStateCard
              icon={<EmptyGlyphChatBubble />}
              title="Henüz mesaj yok"
              description="İlk mesajı veya dosyayı göndererek görüşmeyi başlatabilirsiniz."
            />
          </div>
        ) : (
          threadItems.map((item) => {
            if (item.kind === "day") {
              return (
                <div key={`day-${item.key}`} className="chat-day-separator" role="separator">
                  <span className="chat-day-separator__line" aria-hidden />
                  <span className="chat-day-separator__label">{item.label}</span>
                  <span className="chat-day-separator__line" aria-hidden />
                </div>
              );
            }

            const m = item.message;
            const mine = m.senderId === meId;
            const hasCaption = Boolean(m.body?.trim());
            const pres = getChatThreadPresentation(m);
            const isSystemPlaceholder = pres.mode === "system-error";
            const showTicks = mine && m.id === lastOutgoingMessageId;

            if (pres.mode === "workflow-event") {
              const tone = pres.tone;
              const Icon =
                tone === "positive" ? CheckCircle2 : tone === "warning" ? AlertCircle : Info;
              return (
                <div key={m.id} className="chat-msg chat-msg--workflow-event" role="status">
                  <div className="chat-msg__inner chat-msg__inner--workflow-event">
                    <div
                      className={`chat-bubble chat-bubble--system chat-event-pill chat-event-pill--${tone}`}
                    >
                      <span className="chat-event-pill__glyph" aria-hidden>
                        <Icon size={WORKFLOW_EVENT_ICON_PX} strokeWidth={WORKFLOW_EVENT_ICON_STROKE} />
                      </span>
                      <p className="chat-event-pill__text">{formatWorkflowEventBody(m.body)}</p>
                    </div>
                    <div className="chat-msg__meta chat-msg__meta--workflow-event">
                      <time className="chat-msg__time chat-msg__time--workflow-event" dateTime={m.createdAt}>
                        {formatMsgTime(m.createdAt)}
                      </time>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                className={`chat-msg ${mine ? "chat-msg--mine" : "chat-msg--them"}${isSystemPlaceholder ? " chat-msg--system" : ""}`}
              >
                <div className="chat-msg__inner">
                  <div
                    className={`chat-bubble ${mine ? "chat-bubble--mine" : "chat-bubble--them"}${isSystemPlaceholder ? " chat-bubble--system" : ""}`}
                  >
                    {m.kind === "MEDIA" && m.media ? (
                      <div
                        className={`chat-media-card ${mine ? "chat-media-card--mine" : "chat-media-card--them"}`}
                      >
                        <div className="chat-media-card__surface">
                          {m.media.kind === "IMAGE" ? (
                            <img src={m.media.url} alt="Paylaşılan görüntü" loading="lazy" />
                          ) : (
                            <video src={m.media.url} controls playsInline preload="metadata" />
                          )}
                        </div>
                        <div className="chat-media-card__footer">
                          <a
                            className="chat-media-card__link"
                            href={m.media.url}
                            download
                            target="_blank"
                            rel="noreferrer"
                          >
                            İndir / aç
                          </a>
                          <span className="muted chat-media-card__size">
                            {m.media.sizeBytes >= 1024 * 1024
                              ? `${(m.media.sizeBytes / (1024 * 1024)).toFixed(1)} MB`
                              : `${Math.max(1, Math.round(m.media.sizeBytes / 1024))} KB`}
                          </span>
                        </div>
                      </div>
                    ) : null}
                    {hasCaption ? (
                      <p
                        className={`chat-bubble__body ${m.kind === "MEDIA" && m.media ? "chat-bubble__body--after-media" : ""}`}
                      >
                        {m.body}
                      </p>
                    ) : m.kind === "TEXT" ? (
                      <p className="chat-bubble__body">{m.body}</p>
                    ) : m.kind === "MEDIA" && !m.media ? (
                      <p className="chat-bubble__system">Medya yüklenemedi veya bulunamadı.</p>
                    ) : null}
                  </div>
                  <div
                    className={`chat-msg__meta ${mine ? "chat-msg__meta--mine" : "chat-msg__meta--them"}`}
                  >
                    <time className="chat-msg__time" dateTime={m.createdAt}>
                      {formatMsgTime(m.createdAt)}
                    </time>
                    {mine && showTicks ? (
                      <span
                        className="chat-msg__ticks"
                        aria-label={
                          !m.isDelivered
                            ? "Gönderiliyor"
                            : m.isSeen
                              ? "Görüldü"
                              : "Teslim edildi"
                        }
                      >
                        <OutgoingMessageTicks isDelivered={m.isDelivered} isSeen={m.isSeen} />
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {uploadErr ? <p className="alert-inline alert-inline--error chat-composer-alert">{uploadErr}</p> : null}
      {uploading ? (
        <div className="chat-upload-progress" aria-live="polite">
          <span className="muted">Yükleniyor… {uploadPct}%</span>
          <div className="chat-upload-progress__bar">
            <div className="chat-upload-progress__fill" style={{ width: `${uploadPct}%` }} />
          </div>
        </div>
      ) : null}

      <input
        type="file"
        ref={fileRef}
        className="chat-file-input"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm"
        onChange={(ev) => void onPickFile(ev)}
      />

      <div className="chat-composer-shell">
        <div className="chat-composer-toolbar">
          <button
            type="button"
            className="btn secondary btn--sm chat-composer-attach"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            Dosya ekle
          </button>
          <div className="chat-composer-emoji-wrap" ref={emojiPopoverRef}>
            <button
              type="button"
              className="btn secondary btn--sm chat-composer-emoji-toggle"
              aria-expanded={emojiOpen}
              aria-haspopup="listbox"
              aria-label="Emoji ekle"
              onClick={() => setEmojiOpen((o) => !o)}
            >
              😊
            </button>
            {emojiOpen ? (
              <div className="chat-emoji-picker" role="listbox" aria-label="Hızlı emoji">
                {CHAT_QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    className="chat-emoji-picker__btn"
                    onClick={() => {
                      setBody((prev) => prev + emoji);
                      setEmojiOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="chat-composer-row">
          <input
            type="text"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mesaj yazın…"
            className="chat-composer-input"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
          />
          <button className="btn chat-composer-send" type="button" disabled={sending} onClick={() => void send()}>
            Gönder
          </button>
        </div>
      </div>
    </div>
  );
}
