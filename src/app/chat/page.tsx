import Link from "next/link";
import type { OfferStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ChatInboxThreadLink } from "@/components/tracking/ChatInboxThreadLink";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { getSessionPayload } from "@/lib/session";
import { StatusBadge } from "@/components/offers/StatusBadge";
import {
  EmptyGlyphChatBubble,
  EmptyGlyphExclamationTriangle,
  EmptyGlyphLockClosed,
} from "@/components/icons/emptyStateGlyphs";

function offerTitle(title: string | null, campaignName: string | null): string {
  const t = title?.trim() || campaignName?.trim();
  return t || "İş birliği";
}

function lastMessagePreview(m: { body: string; kind: string } | undefined): string {
  if (!m) return "Henüz mesaj yok";
  if (m.kind === "MEDIA") {
    const b = m.body?.trim();
    return b || "Fotoğraf veya video";
  }
  const t = m.body?.trim();
  if (!t) return "Mesaj";
  return t.length > 80 ? `${t.slice(0, 80)}…` : t;
}

function formatListTime(iso: Date): string {
  try {
    return new Date(iso).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function inboxRowClass(status: OfferStatus, unread: number): string {
  const parts = ["chat-inbox__row"];
  if (unread > 0) parts.push("chat-inbox__row--unread");
  if (["COMPLETED", "REJECTED", "CANCELLED", "DISPUTED"].includes(status)) {
    parts.push("chat-inbox__row--archived");
  } else if (status === "PENDING") {
    parts.push("chat-inbox__row--pending");
  } else {
    parts.push("chat-inbox__row--active");
  }
  return parts.join(" ");
}

function initialFromName(name: string): string {
  const t = name.trim();
  if (!t) return "?";
  return t.slice(0, 1).toLocaleUpperCase("tr-TR");
}

export default async function ChatIndexPage() {
  const session = await getSessionPayload();

  if (!session) {
    return (
      <div className="chat-layout">
        <section className="dash-card dash-card--section">
          <h1 className="dash-section__title">Sohbetler</h1>
          <EmptyStateCard
            icon={<EmptyGlyphLockClosed />}
            title="Oturum gerekli"
            description="İş birliği sohbetlerinizi görmek için giriş yapın."
          >
            <Link className="btn" href="/?mode=login">
              Giriş yap
            </Link>
          </EmptyStateCard>
        </section>
      </div>
    );
  }

  const me = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { role: true },
  });

  if (!me) {
    return (
      <div className="chat-layout">
        <section className="dash-card dash-card--section">
          <h1 className="dash-section__title">Sohbetler</h1>
          <EmptyStateCard
            icon={<EmptyGlyphExclamationTriangle />}
            title="Oturum geçersiz"
            description="Hesabınıza erişilemedi. Lütfen yeniden giriş yapın."
          >
            <Link className="btn" href="/?mode=login">
              Giriş yap
            </Link>
          </EmptyStateCard>
        </section>
      </div>
    );
  }

  const discoverHref = me.role === "BRAND" ? "/marka/discover" : "/influencer/discover";

  const conversations = await prisma.conversation.findMany({
    where: {
      offer: {
        OR: [{ brandId: session.uid }, { influencerId: session.uid }],
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      createdAt: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, createdAt: true, kind: true },
      },
      offer: {
        select: {
          title: true,
          campaignName: true,
          status: true,
          brandId: true,
          influencerId: true,
          brand: {
            select: {
              name: true,
              brand: { select: { companyName: true } },
            },
          },
          influencer: {
            select: {
              name: true,
              influencer: { select: { username: true } },
            },
          },
        },
      },
    },
  });

  const convIds = conversations.map((c) => c.id);
  const unreadRows =
    convIds.length > 0
      ? await prisma.message.groupBy({
          by: ["conversationId"],
          where: {
            conversationId: { in: convIds },
            senderId: { not: session.uid },
            isSeen: false,
          },
          _count: { _all: true },
        })
      : [];
  const unreadByConversation = Object.fromEntries(
    unreadRows.map((r) => [r.conversationId, r._count._all]),
  ) as Record<string, number>;

  return (
    <div className="chat-layout">
      <PageHeader
        eyebrow="Sohbetler"
        title="Görüşmeler"
        description="İş birliği akışınızdaki tüm konuşmalar."
        action={
          <Link className="btn btn--sm" href={discoverHref}>
            {me.role === "BRAND" ? "Influencer keşfet" : "Marka keşfet"}
          </Link>
        }
      />

      {conversations.length === 0 ? (
        <section className="dash-card dash-card--section chat-inbox-empty-card">
          <EmptyStateCard
            icon={<EmptyGlyphChatBubble />}
            hint="İlk mesajın sohbet ekranında — önce bir teklif gönderin veya kabul edin."
            title="Henüz sohbet yok"
            description="Konuşmalar, teklif kabul edildikten sonra burada listelenir. Açık bir teklifiniz varsa Teklifler sayfasından ilgili karta girip sohbete geçebilirsiniz."
          >
            <Link className="btn" href={discoverHref}>
              İlk iş birliğini başlat
            </Link>
          </EmptyStateCard>
        </section>
      ) : (
        <section className="chat-inbox dash-card dash-card--section" aria-label="Sohbet listesi">
          <ul className="chat-inbox__list">
            {conversations.map((c) => {
              const o = c.offer;
              const isBrandViewer = o.brandId === session.uid;
              const otherName = isBrandViewer
                ? o.influencer?.influencer?.username ?? o.influencer?.name ?? "Influencer"
                : o.brand?.brand?.companyName ?? o.brand?.name ?? "Marka";
              const sideLabel = isBrandViewer ? "Influencer" : "Marka";
              const t = offerTitle(o.title, o.campaignName);
              const last = c.messages[0];
              const preview = lastMessagePreview(last);
              const when = last ? last.createdAt : c.createdAt;
              const unread = unreadByConversation[c.id] ?? 0;
              const rowClass = inboxRowClass(o.status, unread);
              return (
                <li key={c.id}>
                  <ChatInboxThreadLink className={rowClass} href={`/chat/${c.id}`}>
                    <div className="chat-inbox__row-inner">
                      <div className="chat-inbox__avatar" aria-hidden>
                        {initialFromName(otherName)}
                      </div>
                      <div className="chat-inbox__main">
                        <div className="chat-inbox__row-top">
                          <div className="chat-inbox__identity">
                            <span className="chat-inbox__role">{sideLabel}</span>
                            <span className="chat-inbox__name">{otherName}</span>
                          </div>
                          <time className="chat-inbox__time muted" dateTime={when.toISOString()}>
                            {formatListTime(when)}
                          </time>
                        </div>
                        <p className="chat-inbox__campaign">{t}</p>
                        <div className="chat-inbox__row-bottom">
                          <StatusBadge status={o.status} />
                          <p className="chat-inbox__preview muted">{preview}</p>
                        </div>
                      </div>
                      {unread > 0 ? (
                        <span className="chat-inbox__unread-badge" aria-label={`${unread} okunmamış`}>
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
                    </div>
                  </ChatInboxThreadLink>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
