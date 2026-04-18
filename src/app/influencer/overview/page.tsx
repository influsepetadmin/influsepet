import Link from "next/link";
import {
  Briefcase,
  Compass,
  Inbox,
  MessageCircle,
  Percent,
  User,
  UserCircle,
} from "lucide-react";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { OverviewSectionCard } from "@/components/overview/OverviewSectionCard";
import { OverviewStatCard } from "@/components/overview/OverviewStatCard";
import { QuickActionCard } from "@/components/overview/QuickActionCard";
import "@/components/overview/overview.css";
import { getCategoryLabel } from "@/lib/categories";
import {
  computeInfluencerProfileCompletionPercent,
  isInfluencerDashboardProfileComplete,
} from "@/lib/dashboardProfileCompletion";
import { getInfluencerPanelAccess } from "@/lib/influencer/panelAccess";
import { prisma } from "@/lib/prisma";
import { statusBadgeLabel } from "@/components/offers/StatusBadge";
import { EmptyGlyphChatBubble, EmptyGlyphInbox } from "@/components/icons/emptyStateGlyphs";

function messagePreview(body: string, kind: string): string {
  if (kind === "MEDIA") {
    const b = body?.trim();
    return b || "Medya";
  }
  const t = body?.trim();
  if (!t) return "Mesaj";
  return t.length > 72 ? `${t.slice(0, 72)}…` : t;
}

export default async function InfluencerOverviewPage() {
  const access = await getInfluencerPanelAccess();
  if (access.ok === false) {
    if (access.kind === "admin") {
      return (
        <ForbiddenStateCard
          title="Bu alan influencer hesapları içindir"
          description="Yönetici hesabıyla bu panel kullanılamaz."
        />
      );
    }
    return (
      <ForbiddenStateCard
        title="Bu alan influencer hesapları içindir"
        description="Şu an marka hesabıyla giriş yaptınız. Marka işlemleri için marka panelini kullanın."
        panelHref="/marka"
        panelLabel="Marka paneline git"
      />
    );
  }

  const { user } = access;
  const profile = user.influencer;
  const selectedCategoryKeysRaw = profile?.selectedCategories?.map((c) => c.categoryKey) ?? [];
  const selectedCategoryKeys =
    selectedCategoryKeysRaw.length > 0
      ? selectedCategoryKeysRaw.slice(0, 3)
      : profile?.category
        ? [profile.category]
        : [];
  const profileComplete = isInfluencerDashboardProfileComplete(profile, selectedCategoryKeys);
  const profilePct = profileComplete
    ? 100
    : computeInfluencerProfileCompletionPercent(profile, selectedCategoryKeys);

  const [
    pendingOfferCount,
    pipelineOfferCount,
    unreadChatThreads,
    recentOffers,
    conversationRows,
  ] = await Promise.all([
    profile ? prisma.offer.count({ where: { influencerId: user.id, status: "PENDING" } }) : 0,
    profile
      ? prisma.offer.count({
          where: {
            influencerId: user.id,
            status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
          },
        })
      : 0,
    prisma.conversation.count({
      where: {
        offer: { influencerId: user.id },
        messages: {
          some: {
            senderId: { not: user.id },
            isSeen: false,
          },
        },
      },
    }),
    profile
      ? prisma.offer.findMany({
          where: { influencerId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            initiatedBy: true,
            brand: {
              select: {
                brand: { select: { companyName: true } },
                name: true,
              },
            },
          },
        })
      : [],
    prisma.conversation.findMany({
      where: { offer: { influencerId: user.id } },
      select: {
        id: true,
        offer: {
          select: {
            title: true,
            campaignName: true,
            brand: {
              select: {
                name: true,
                brand: { select: { companyName: true } },
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, body: true, kind: true },
        },
      },
    }),
  ]);

  const recentChats = [...conversationRows]
    .sort((a, b) => {
      const ta = a.messages[0]?.createdAt?.getTime() ?? 0;
      const tb = b.messages[0]?.createdAt?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, 3);

  return (
    <div className="dashboard-page influencer-panel-page overview-page">
      <PageHeader
        eyebrow="Panel"
        title="Genel Bakış"
        description="Tekliflerini, sohbetlerini ve iş birliklerini tek yerden takip et."
        action={
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
            <Link className="btn btn--sm" href="/influencer/discover">
              Keşfet
            </Link>
            <Link className="btn secondary btn--sm" href="/influencer/profile">
              Profili düzenle
            </Link>
          </div>
        }
      />

      <div className="overview-page__grid-stats">
        <OverviewStatCard
          href="/influencer/offers?tab=gelen&durum=bekleyen"
          label="Bekleyen teklifler"
          value={pendingOfferCount}
          hint="Yanıt bekleyen iş birlikleri"
          icon={<Inbox size={18} strokeWidth={1.85} />}
        />
        <OverviewStatCard
          href="/influencer/collaborations?tab=aktif"
          label="Aktif iş birlikleri"
          value={pipelineOfferCount}
          hint="Tamamlanmamış süreçler"
          icon={<Briefcase size={18} strokeWidth={1.85} />}
        />
        <OverviewStatCard
          href="/chat"
          label="Okunmamış sohbet"
          value={unreadChatThreads}
          hint="Karşı taraftan gelen okunmamış mesaj"
          icon={<MessageCircle size={18} strokeWidth={1.85} />}
        />
        <OverviewStatCard
          href="/influencer/profile?tab=genel"
          label="Profil tamamlama"
          value={`${profilePct}%`}
          hint={profileComplete ? "Profil güncel" : "Eksik alanları tamamla"}
          icon={<Percent size={18} strokeWidth={1.85} />}
        />
      </div>

      <div className="overview-page__grid-two">
        <OverviewSectionCard title="Son teklifler" footerHref="/influencer/offers" footerLabel="Tüm teklifler">
          {recentOffers.length === 0 ? (
            <EmptyStateCard
              icon={<EmptyGlyphInbox />}
              title="Henüz teklif yok"
              description="Markalardan veya sizden oluşan ilk teklif burada listelenir. Keşfet ile marka arayarak başlayabilirsiniz."
            >
              <Link className="btn secondary btn--sm" href="/influencer/discover">
                Marka keşfet
              </Link>
            </EmptyStateCard>
          ) : (
            <div>
              {recentOffers.map((o) => (
                <div key={o.id} className="ov-offer-row">
                  <div>
                    <p className="ov-offer-row__title">{o.title}</p>
                    <p className="muted ov-offer-row__sub">
                      {o.brand?.brand?.companyName ?? o.brand?.name ?? "Marka"} ·{" "}
                      {o.initiatedBy === "BRAND" ? "Gelen" : "Gönderilen"}
                    </p>
                  </div>
                  <div className="ov-offer-row__meta">
                    <span className="status-badge">{statusBadgeLabel(o.status)}</span>
                    <time className="muted" style={{ fontSize: "0.78rem" }} dateTime={o.updatedAt.toISOString()}>
                      {o.updatedAt.toLocaleDateString("tr-TR")}
                    </time>
                  </div>
                </div>
              ))}
            </div>
          )}
        </OverviewSectionCard>

        <OverviewSectionCard title="Son sohbetler" footerHref="/chat" footerLabel="Tüm sohbetler">
          {recentChats.length === 0 ? (
            <EmptyStateCard
              icon={<EmptyGlyphChatBubble />}
              title="Sohbet geçmişi boş"
              description="İş birliği oluşturduğunuzda ilgili sohbet burada görünür. Teklif veya keşfet ile başlayın."
            >
              <Link className="btn secondary btn--sm" href="/influencer/discover">
                Keşfet
              </Link>
            </EmptyStateCard>
          ) : (
            <div>
              {recentChats.map((c) => {
                const last = c.messages[0];
                const brandName =
                  c.offer.brand?.brand?.companyName?.trim() || c.offer.brand?.name?.trim() || "Marka";
                const offerTitle = c.offer.title?.trim() || c.offer.campaignName?.trim() || "İş birliği";
                return (
                  <Link key={c.id} href={`/chat/${c.id}`} className="ov-chat-row">
                    <div>
                      <p className="ov-chat-row__title">{offerTitle}</p>
                      <p className="muted ov-chat-row__sub">{brandName}</p>
                      {last ? (
                        <p className="muted ov-chat-row__sub" style={{ marginTop: 4 }}>
                          {messagePreview(last.body, last.kind)}
                        </p>
                      ) : null}
                    </div>
                    {last ? (
                      <time className="muted ov-chat-row__time" dateTime={last.createdAt.toISOString()}>
                        {last.createdAt.toLocaleDateString("tr-TR", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          )}
        </OverviewSectionCard>
      </div>

      <div className="overview-page__grid-actions">
        <QuickActionCard
          href="/influencer/discover"
          title="Yeni marka keşfet"
          description="Şehir ve kategoriye göre marka ara, iş birliği başlat."
          icon={<Compass size={20} strokeWidth={1.75} />}
        />
        <QuickActionCard
          href="/influencer/profile?tab=genel"
          title="Profili güncelle"
          description="Fiyat, niş ve kategorilerinle görünürlüğünü artır."
          icon={<User size={20} strokeWidth={1.75} />}
        />
        <QuickActionCard
          href="/chat"
          title="Sohbetlere git"
          description="Aktif iş birliklerindeki mesajları aç."
          icon={<MessageCircle size={20} strokeWidth={1.75} />}
        />
        <QuickActionCard
          href="/influencer/collaborations"
          title="İş birliklerini görüntüle"
          description="Aktif, teslim ve tamamlanan süreçleri incele."
          icon={<Briefcase size={20} strokeWidth={1.75} />}
        />
      </div>

      {!profileComplete && profile ? (
        <section className="ov-profile-nudge--compact">
          <h2 className="dash-section__title">Profil tamamlama</h2>
          <p className="dash-section__lede muted" style={{ marginBottom: 12 }}>
            Kategoriler, şehir ve fiyat bilgileri görünürlüğünüzü artırır.
            {selectedCategoryKeys.length > 0
              ? ` Seçili kategoriler: ${selectedCategoryKeys.map((k) => getCategoryLabel(k)).join(", ")}.`
              : ""}
          </p>
          <Link className="btn btn--sm" href="/influencer/profile?tab=genel">
            Profili tamamla
          </Link>
        </section>
      ) : null}

      {profile ? (
        <p className="muted" style={{ marginTop: 16, fontSize: "0.88rem" }}>
          <UserCircle size={14} strokeWidth={2} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
          <Link href={`/u/${encodeURIComponent(profile.username)}`} style={{ fontWeight: 700 }}>
            Herkese açık profili görüntüle
          </Link>
        </p>
      ) : null}
    </div>
  );
}
