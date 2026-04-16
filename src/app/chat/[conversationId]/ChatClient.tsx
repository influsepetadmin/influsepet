"use client";

import type { OfferStatus } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphChatBubble } from "@/components/icons/emptyStateGlyphs";
import { CollaborationRatingPanel } from "@/components/offers/CollaborationRatingPanel";
import { DeliveryPanel } from "@/components/offers/DeliveryPanel";
import { StatusBadge } from "@/components/offers/StatusBadge";

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

const TICK_GRAY = "#64748b";
/** Seen state — matches premium purple accent (presentation only). */
const TICK_BLUE = "#4f46e5";

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

function TickCheck({ stroke }: { stroke: string }) {
  return (
    <svg width="12" height="11" viewBox="0 0 14 12" className="chat-ticks-svg chat-ticks-svg--unit" aria-hidden>
      <path
        d="M1.5 6.2 L5.2 9.8 L12.5 2"
        stroke={stroke}
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
  const stroke = isSeen ? TICK_BLUE : TICK_GRAY;

  if (!isDelivered) {
    return <TickCheck stroke={TICK_GRAY} />;
  }

  return (
    <span className="chat-ticks-double" aria-hidden>
      <TickCheck stroke={stroke} />
      <TickCheck stroke={stroke} />
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

export default function ChatClient({
  conversationId,
  meId,
  offer,
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

  const offerTitle = chatContext.offerTitle;

  const lastOutgoingMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].senderId === meId) return messages[i].id;
    }
    return null;
  }, [messages, meId]);

  return (
    <div className="chat-conversation">
      <header className="chat-conversation__header chat-conversation__header--rich">
        <div className="chat-conversation__header-identity">
          <div className="chat-conversation__avatar-ring" aria-hidden>
            <img
              className="chat-conversation__avatar"
              src={chatContext.otherSideAvatarSrc}
              alt=""
              width={48}
              height={48}
            />
          </div>
          <div className="chat-conversation__header-text">
            <span className="chat-conversation__eyebrow">{chatContext.otherSideRole}</span>
            <h2 className="chat-conversation__title">{chatContext.otherSideName}</h2>
            {chatContext.otherSideHandleLine ? (
              <p className="chat-conversation__handle muted">{chatContext.otherSideHandleLine}</p>
            ) : null}
            <p className="chat-conversation__subtitle muted">{chatContext.offerTitle}</p>
          </div>
        </div>
        <div className="chat-conversation__header-aside">
          <StatusBadge status={offer.status} />
          <Link className="btn secondary btn--sm" href={chatContext.profileHref}>
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
        offerTitle={offerTitle}
      />
      <CollaborationRatingPanel
        offerId={offer.id}
        offerStatus={offer.status}
        chatActivityEpoch={ratingChatEpoch}
      />

      <div className="chat-thread chat-thread--premium">
        {messages.length === 0 ? (
          <EmptyStateCard
            icon={<EmptyGlyphChatBubble />}
            title="Henüz mesaj yok"
            description="İlk mesajı veya dosyayı göndererek görüşmeyi başlatabilirsiniz."
          />
        ) : (
          messages.map((m) => {
            const mine = m.senderId === meId;
            const hasCaption = Boolean(m.body?.trim());
            return (
              <div key={m.id} className={`chat-msg ${mine ? "chat-msg--mine" : "chat-msg--them"}`}>
                <div className="chat-msg__inner">
                  <div
                    className={`chat-bubble ${mine ? "chat-bubble--mine" : "chat-bubble--them"}`}
                  >
                    {m.kind === "MEDIA" && m.media ? (
                      <div className="chat-media-card">
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
                      <p className="chat-bubble__system muted">Medya</p>
                    ) : null}
                    {mine && m.id === lastOutgoingMessageId && (
                      <span
                        className="chat-ticks-row"
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
                    )}
                  </div>
                  <time className="chat-msg__time muted" dateTime={m.createdAt}>
                    {formatMsgTime(m.createdAt)}
                  </time>
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
