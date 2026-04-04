import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { getSessionPayload } from "@/lib/session";
import { StatusBadge } from "@/components/offers/StatusBadge";

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

export default async function ChatIndexPage() {
  const session = await getSessionPayload();

  if (!session) {
    return (
      <div className="chat-layout">
        <section className="dash-card dash-card--section">
          <h1 className="dash-section__title">Sohbetler</h1>
          <EmptyStateCard
            icon="🔐"
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
            icon="⚠️"
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

  const panelHref = me.role === "BRAND" ? "/marka" : me.role === "INFLUENCER" ? "/influencer" : "/";

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

  return (
    <div className="chat-layout">
      <header className="chat-page-header">
        <div className="chat-page-header__main">
          <h1 className="chat-page-header__title">Sohbetler</h1>
          <p className="chat-page-header__lede muted">İş birliği görüşmeleriniz burada listelenir.</p>
        </div>
        <Link className="btn secondary" href={panelHref}>
          Panele dön
        </Link>
      </header>

      {conversations.length === 0 ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon="💬"
            title="Henüz sohbet yok"
            description="Sohbetler, kabul edilmiş iş birlikleri üzerinden açılır. Önce bir teklif oluşturun veya gelen teklifi kabul edin."
          >
            <Link className="btn" href={panelHref}>
              Uygun panele git
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
              return (
                <li key={c.id}>
                  <Link className="chat-inbox__row" href={`/chat/${c.id}`}>
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
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
