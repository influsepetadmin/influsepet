"use client";

import type { DeliveryStatus, OfferStatus } from "@prisma/client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChatOfferWorkflowActions } from "@/components/chat/ChatOfferWorkflowActions";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphChatBubble } from "@/components/icons/emptyStateGlyphs";
import { CollaborationRatingPanel } from "@/components/offers/CollaborationRatingPanel";
import { DeliveryPanel } from "@/components/offers/DeliveryPanel";
import { AlertCircle, ArrowLeft, CheckCircle2, Compass, Info, LayoutDashboard } from "lucide-react";
import { formatWorkflowEventBody, getChatThreadPresentation } from "@/lib/chat/chatThreadMessagePresentation";
import {
  buildWorkspaceMilestones,
  workspaceDeliveryPill,
  workspaceOfferPill,
} from "@/lib/chat/workspaceMilestones";

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

function formatMsgTimeFull(iso: string): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      dateStyle: "short",
      timeStyle: "short",
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

function isPeerChatLine(m: Msg): boolean {
  const p = getChatThreadPresentation(m);
  return p.mode !== "workflow-event" && p.mode !== "system-error";
}

function prevSameCluster(threadItems: ThreadItem[], idx: number, m: Msg): boolean {
  if (!isPeerChatLine(m)) return false;
  for (let i = idx - 1; i >= 0; i--) {
    const it = threadItems[i];
    if (it.kind === "day") return false;
    const pm = it.message;
    if (!isPeerChatLine(pm)) return false;
    return pm.senderId === m.senderId;
  }
  return false;
}

function nextSameCluster(threadItems: ThreadItem[], idx: number, m: Msg): boolean {
  if (!isPeerChatLine(m)) return false;
  for (let i = idx + 1; i < threadItems.length; i++) {
    const it = threadItems[i];
    if (it.kind === "day") return false;
    const pm = it.message;
    if (!isPeerChatLine(pm)) return false;
    return pm.senderId === m.senderId;
  }
  return false;
}

type MessageClusterMeta =
  | { kind: "event"; clusterStart: true; clusterEnd: true; showTime: true }
  | {
      kind: "peer";
      clusterStart: boolean;
      clusterEnd: boolean;
      clusterMid: boolean;
      showTime: boolean;
    };

function messageClusterMeta(threadItems: ThreadItem[], idx: number, m: Msg): MessageClusterMeta {
  const p = getChatThreadPresentation(m);
  if (p.mode === "workflow-event" || p.mode === "system-error") {
    return { kind: "event", clusterStart: true, clusterEnd: true, showTime: true };
  }
  const clusterStart = !prevSameCluster(threadItems, idx, m);
  const clusterEnd = !nextSameCluster(threadItems, idx, m);
  return {
    kind: "peer",
    clusterStart,
    clusterEnd,
    clusterMid: !clusterStart && !clusterEnd,
    showTime: clusterEnd,
  };
}

function ChatThreadSkeleton() {
  return (
    <div className="chat-thread-skeleton" aria-busy="true" aria-label="Mesajlar yükleniyor">
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`chat-thread-skeleton__row${i % 3 === 0 ? " chat-thread-skeleton__row--them" : " chat-thread-skeleton__row--mine"}`}
        >
          <div className="chat-thread-skeleton__bar" />
        </div>
      ))}
    </div>
  );
}

function isRevisionWorkflowCopy(body: string): boolean {
  return /revizyon|revize|düzenle|duzenle|yeniden\s+teslim|yeniden teslim/i.test(body);
}

function ChatWorkspaceNav({
  chatListHref,
  homeHref,
  discoverHref,
  offersPanelHref,
  collaborationTitle,
  discoverLabel,
}: {
  chatListHref: string;
  homeHref: string;
  discoverHref: string;
  offersPanelHref: string;
  collaborationTitle: string;
  discoverLabel: string;
}) {
  return (
    <nav className="chat-workflow-nav" aria-label="Sohbet gezintisi">
      <div className="chat-workflow-nav__start">
        <Link className="chat-workflow-nav__back" href={chatListHref}>
          <span className="chat-workflow-nav__back-icon" aria-hidden>
            <ArrowLeft size={18} strokeWidth={2} />
          </span>
          <span className="chat-workflow-nav__back-text">Sohbetler</span>
        </Link>
      </div>
      <div className="chat-workflow-nav__context" title={collaborationTitle}>
        <Link className="chat-workflow-nav__panel" href={homeHref}>
          <LayoutDashboard className="chat-workflow-nav__panel-icon" size={16} strokeWidth={2} aria-hidden />
          <span className="chat-workflow-nav__panel-text">Panele dön</span>
        </Link>
        <span className="chat-workflow-nav__context-sep" aria-hidden>
          /
        </span>
        <span className="chat-workflow-nav__title-truncate">{collaborationTitle}</span>
      </div>
      <div className="chat-workflow-nav__end">
        <Link className="btn secondary btn--sm" href={discoverHref}>
          <Compass size={16} strokeWidth={2} aria-hidden className="chat-workflow-nav__btn-icon" />
          {discoverLabel}
        </Link>
        <Link className="btn secondary btn--sm" href={offersPanelHref}>
          Teklifler
        </Link>
      </div>
    </nav>
  );
}

function ChatWorkspacePills({
  offerStatus,
  latestDelivery,
}: {
  offerStatus: OfferStatus;
  latestDelivery: { status: DeliveryStatus } | null;
}) {
  const o = workspaceOfferPill(offerStatus);
  const d = workspaceDeliveryPill(offerStatus, latestDelivery);
  return (
    <div className="chat-workspace-pills" role="list" aria-label="İş birliği durumu">
      <span role="listitem" className={`chat-workspace-pill chat-workspace-pill--${o.tone}`}>
        {o.text}
      </span>
      {d ? (
        <span
          role="listitem"
          className={`chat-workspace-pill chat-workspace-pill--${d.tone} chat-workspace-pill--secondary`}
        >
          {d.text}
        </span>
      ) : null}
    </div>
  );
}

function ChatWorkspaceTimeline({ offerStatus }: { offerStatus: OfferStatus }) {
  const items = buildWorkspaceMilestones(offerStatus);
  return (
    <div className="chat-workspace-timeline" aria-label="İş akışı kilometre taşları">
      <p className="chat-workspace-timeline__label muted">Akış</p>
      <ol className="chat-workspace-timeline__track" role="list">
        {items.map((it) => (
          <li
            key={it.key}
            className={`chat-workspace-timeline__step chat-workspace-timeline__step--${it.state}`}
            title={it.label}
          >
            <span className="chat-workspace-timeline__dot" aria-hidden />
            <span className="chat-workspace-timeline__text">{it.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function ChatClient({
  conversationId,
  meId,
  offer,
  workflowMeta,
  workspaceNav,
  workspaceSummary,
  chatContext,
  offersPanelHref,
  availableNextTransitions,
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
    dueDateLabel: string | null;
  };
  workspaceNav: {
    chatListHref: string;
    homeHref: string;
    discoverHref: string;
    offersPanelHref: string;
    collaborationTitle: string;
    discoverLabel: string;
  };
  workspaceSummary: {
    latestDelivery: { status: DeliveryStatus } | null;
  };
  chatContext: {
    otherSideName: string;
    otherSideRole: string;
    otherSideAvatarSrc: string;
    otherSideHandleLine: string | null;
    profileHref: string;
    offerTitle: string;
    brief: string;
  };
  offersPanelHref: string;
  availableNextTransitions: OfferStatus[];
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [ratingChatEpoch, setRatingChatEpoch] = useState(0);
  const [threadReady, setThreadReady] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const emojiPopoverRef = useRef<HTMLDivElement>(null);
  const seenInFlightRef = useRef(false);
  const chatLoadsRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(conversationId)}`);
      const data = await res.json().catch(() => null);
      if (!data?.messages) {
        setMessages([]);
      } else {
        const msgs = data.messages as Msg[];
        setMessages(msgs);
        chatLoadsRef.current += 1;
        /** After the first poll, bump epoch so CollaborationRatingPanel refetches (counterparty may have just rated). */
        if (offer.status === "COMPLETED" && chatLoadsRef.current >= 2) {
          setRatingChatEpoch((n) => n + 1);
        }

        const needsSeen = msgs.some((m) => m.senderId !== meId && !m.isSeen);
        if (needsSeen && !seenInFlightRef.current) {
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
        }
      }
    } finally {
      setThreadReady(true);
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
    <div className="chat-conversation chat-conversation--workspace">
      <div className="chat-workspace-top chat-workspace-top--sticky">
        <ChatWorkspaceNav {...workspaceNav} />
        <header
          className="chat-workflow-card chat-workflow-card--workspace chat-workspace-summary-card"
          id="chat-workspace-header"
        >
          <div className="chat-workspace-summary-card__intro">
            <p className="chat-workspace-summary-card__eyebrow muted">Kampanya ve teslim özeti</p>
            <div className="chat-workflow-card__title-row chat-workflow-card__title-row--workspace">
              <div className="chat-workflow-card__title-block">
                <span className="chat-workflow-card__kicker">İş birliği çalışma alanı</span>
                <h2 className="chat-workflow-card__title">{chatContext.offerTitle}</h2>
                <ChatWorkspacePills
                  offerStatus={offer.status}
                  latestDelivery={workspaceSummary.latestDelivery}
                />
                {chatContext.brief.trim() ? (
                  <p className="chat-workflow-card__brief muted">{chatContext.brief}</p>
                ) : null}
              </div>
            </div>
            <ChatWorkspaceTimeline offerStatus={offer.status} />
          </div>

          <div className="chat-workflow-card__identity chat-workflow-card__identity--workspace">
            <Link
              className="chat-workflow-card__avatar-hit"
              href={chatContext.profileHref}
              title="Herkese açık profil"
            >
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
            </Link>
            <div className="chat-workflow-card__identity-main">
              <span className="chat-workflow-card__identity-role">{chatContext.otherSideRole}</span>
              <span className="chat-workflow-card__identity-name">{chatContext.otherSideName}</span>
              {chatContext.otherSideHandleLine ? (
                <span className="chat-workflow-card__identity-handle muted">{chatContext.otherSideHandleLine}</span>
              ) : null}
            </div>
            <Link className="chat-workflow-card__profile-quick" href={chatContext.profileHref}>
              Profili görüntüle
            </Link>
          </div>

          <dl className="chat-workflow-card__metrics" aria-label="Özet rakamlar">
            <div className="chat-workflow-metric">
              <dt className="chat-workflow-metric__label">Bütçe</dt>
              <dd className="chat-workflow-metric__value">{workflowMeta.budgetLabel}</dd>
            </div>
            <div className="chat-workflow-metric">
              <dt className="chat-workflow-metric__label">Son teslim</dt>
              <dd
                className={`chat-workflow-metric__value${workflowMeta.dueDateLabel ? "" : " chat-workflow-metric__value--muted"}`}
              >
                {workflowMeta.dueDateLabel ?? "—"}
              </dd>
            </div>
            <div className="chat-workflow-metric">
              <dt className="chat-workflow-metric__label">Başlangıç</dt>
              <dd className="chat-workflow-metric__value chat-workflow-metric__value--muted">
                {workflowMeta.createdAtLabel}
              </dd>
            </div>
          </dl>

          <ChatOfferWorkflowActions
            offerId={offer.id}
            availableNextTransitions={availableNextTransitions}
            profileHref={chatContext.profileHref}
            offersPanelHref={offersPanelHref}
            showDeliveryShortcut={
              offer.status === "IN_PROGRESS" ||
              offer.status === "REVISION_REQUESTED" ||
              offer.status === "DELIVERED"
            }
          />

          <div className="chat-workflow-card__workspace-foot">
            <p className="chat-workflow-card__workspace-hint muted">
              Teslim ve puanlama aşağıda; mesajlar bu özetin altında devam eder.
            </p>
          </div>
        </header>
      </div>

      <section className="chat-workspace-block" aria-labelledby="chat-delivery-section-label">
        <div className="chat-workspace-block__head">
          <h3 id="chat-delivery-section-label" className="chat-workspace-block__label">
            Teslimat
          </h3>
          <p className="chat-workspace-block__hint muted">Kanıt yükleyin veya teslim kayıtlarını buradan izleyin.</p>
        </div>
        <div id="chat-delivery-anchor" className="chat-delivery-anchor">
          <DeliveryPanel
            offerId={offer.id}
            offerStatus={offer.status}
            brandId={offer.brandId}
            influencerId={offer.influencerId}
            meId={meId}
          />
        </div>
      </section>

      <section className="chat-workspace-block chat-workspace-block--rating" aria-labelledby="chat-rating-section-label">
        <h3 id="chat-rating-section-label" className="chat-workspace-block__label">
          Değerlendirme
        </h3>
        <div className="chat-rating-wrap">
          <CollaborationRatingPanel
            offerId={offer.id}
            offerStatus={offer.status}
            chatActivityEpoch={ratingChatEpoch}
          />
        </div>
      </section>

      <div className="chat-thread chat-thread--premium" role="region" aria-label="Mesajlar">
        {!threadReady ? (
          <ChatThreadSkeleton />
        ) : messages.length === 0 ? (
          <div className="chat-thread-empty chat-thread-empty--premium">
            <EmptyStateCard
              icon={<EmptyGlyphChatBubble />}
              title="Henüz mesaj yok"
              description="İlk mesajı veya dosyayı göndererek görüşmeyi başlatın. Teslim ve iş akışı güncellemeleri üstteki özetten takip edilir."
            />
          </div>
        ) : (
          threadItems.map((item, itemIdx) => {
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
            const cluster = messageClusterMeta(threadItems, itemIdx, m);

            if (pres.mode === "workflow-event") {
              const tone = pres.tone;
              const Icon =
                tone === "positive" ? CheckCircle2 : tone === "warning" ? AlertCircle : Info;
              const revisionEmphasis = isRevisionWorkflowCopy(m.body);
              return (
                <div
                  key={m.id}
                  className={`chat-msg chat-msg--workflow-event${revisionEmphasis ? " chat-msg--workflow-revision" : ""}`}
                  role="status"
                >
                  <div className="chat-msg__inner chat-msg__inner--workflow-event">
                    <span className="chat-workflow-thread-label">İş akışı</span>
                    <div
                      className={`chat-bubble chat-bubble--system chat-event-pill chat-event-pill--${tone}${revisionEmphasis ? " chat-event-pill--revision-emphasis" : ""}`}
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

            const peerCluster =
              cluster.kind === "peer"
                ? [
                    "chat-msg--peer",
                    cluster.clusterStart ? "chat-msg--cluster-start" : "",
                    cluster.clusterEnd ? "chat-msg--cluster-end" : "",
                    cluster.clusterMid ? "chat-msg--cluster-mid" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")
                : "";

            const timeTitle = cluster.kind === "peer" && !cluster.showTime ? formatMsgTimeFull(m.createdAt) : undefined;

            return (
              <div
                key={m.id}
                className={`chat-msg ${mine ? "chat-msg--mine" : "chat-msg--them"}${isSystemPlaceholder ? " chat-msg--system" : ""} ${peerCluster}`.trim()}
              >
                <div
                  className="chat-msg__inner"
                  title={timeTitle}
                >
                  <div
                    className={`chat-bubble ${mine ? "chat-bubble--mine" : "chat-bubble--them"}${isSystemPlaceholder ? " chat-bubble--system" : ""}`}
                  >
                    {m.kind === "MEDIA" && m.media ? (
                      <div
                        className={`chat-media-card ${mine ? "chat-media-card--mine" : "chat-media-card--them"}`}
                      >
                        <a
                          className="chat-media-card__hit"
                          href={m.media.url}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Medyayı tam boyutta aç"
                        >
                          <div className="chat-media-card__surface">
                            {m.media.kind === "IMAGE" ? (
                              <img src={m.media.url} alt="Paylaşılan görüntü" loading="lazy" />
                            ) : (
                              <video src={m.media.url} controls playsInline preload="metadata" />
                            )}
                          </div>
                        </a>
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
                    <time
                      className={`chat-msg__time${cluster.kind === "peer" && !cluster.showTime ? " chat-msg__time--cluster-hidden" : ""}`}
                      dateTime={m.createdAt}
                    >
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
