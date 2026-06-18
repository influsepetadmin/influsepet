import Link from "next/link";
import { Compass, Megaphone, MessageCircle, Inbox, Send, Briefcase } from "lucide-react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { OverviewSectionCard } from "@/components/overview/OverviewSectionCard";
import { OverviewStatCard } from "@/components/overview/OverviewStatCard";
import { ProfileCompletionCard } from "@/components/overview/ProfileCompletionCard";
import { QuickActionCard } from "@/components/overview/QuickActionCard";
import "@/components/overview/overview.css";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";
import { prisma } from "@/lib/prisma";
import { statusBadgeLabel } from "@/components/offers/StatusBadge";
import { computeBrandProfileCompletion } from "@/lib/dashboardProfileCompletion";
import { EmptyGlyphChatHistory, EmptyGlyphOffer } from "@/components/icons/emptyStateGlyphs";

function messagePreview(body: string, kind: string): string {
  if (kind === "MEDIA") {
    const b = body?.trim();
    return b || "Medya";
  }
  const t = body?.trim();
  if (!t) return "Mesaj";
  return t.length > 72 ? `${t.slice(0, 72)}…` : t;
}

export default async function MarkaOverviewPage() {
  const access = await getMarkaPanelAccess();
  if (access.ok === false) {
    if (access.kind === "admin") {
      return (
        <ForbiddenStateCard
          title="Bu alan marka hesapları içindir"
          description="Yönetici hesabıyla bu panel kullanılamaz."
        />
      );
    }
    return (
      <ForbiddenStateCard
        title="Bu alan marka hesapları içindir"
        description="Şu an influencer hesabıyla giriş yaptınız."
        panelHref="/influencer"
        panelLabel="Influencer paneline git"
      />
    );
  }

  const { user } = access;
  const profile = user.brand;
  const canUseMarketplace = Boolean(profile);

  const [
    sentOfferCount,
    publishedCampaignCount,
    pipelineOfferCount,
    unreadChatThreads,
    recentOffers,
    conversationRows,
    socialAccountCount,
    verifiedSocialAccountCount,
  ] = await Promise.all([
    canUseMarketplace
      ? prisma.offer.count({ where: { brandId: user.id, initiatedBy: "BRAND" } })
      : 0,
    canUseMarketplace
      ? prisma.offer
          .findMany({
            where: {
              brandId: user.id,
              campaignName: { not: null },
            },
            select: { campaignName: true },
            distinct: ["campaignName"],
          })
          .then((rows) => rows.filter((r) => (r.campaignName ?? "").trim().length > 0).length)
      : 0,
    canUseMarketplace
      ? prisma.offer.count({
          where: {
            brandId: user.id,
            status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
          },
        })
      : 0,
    prisma.conversation.count({
      where: {
        offer: { brandId: user.id },
        messages: {
          some: {
            senderId: { not: user.id },
            isSeen: false,
          },
        },
      },
    }),
    canUseMarketplace
      ? prisma.offer.findMany({
          where: { brandId: user.id },
          orderBy: { updatedAt: "desc" },
          take: 3,
          select: {
            id: true,
            title: true,
            status: true,
            updatedAt: true,
            initiatedBy: true,
            influencer: {
              select: {
                name: true,
                influencer: { select: { username: true } },
              },
            },
          },
        })
      : [],
    prisma.conversation.findMany({
      where: { offer: { brandId: user.id } },
      select: {
        id: true,
        offer: {
          select: {
            title: true,
            campaignName: true,
            influencer: {
              select: {
                name: true,
                influencer: { select: { username: true } },
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
    prisma.socialAccount.count({ where: { userId: user.id, isConnected: true } }),
    prisma.socialAccount.count({
      where: { userId: user.id, isVerified: true, verificationStatus: "VERIFIED" },
    }),
  ]);

  const profileCompletion = computeBrandProfileCompletion({
    profile,
    socialAccountCount,
    verifiedSocialAccountCount,
  });

  const recentChats = [...conversationRows]
    .sort((a, b) => {
      const ta = a.messages[0]?.createdAt?.getTime() ?? 0;
      const tb = b.messages[0]?.createdAt?.getTime() ?? 0;
      return tb - ta;
    })
    .slice(0, 3);

  return (
    <div className="dashboard-page influencer-panel-page overview-page marka-overview">
      <PageHeader
        eyebrow="Panel"
        title="Genel Bakış"
        description="Influencer arayın, teklif gönderin ve kampanya akışını tek yerden takip edin."
        action={
          <div className="dashboard-page__actions">
            <Link className="btn btn--sm" href="/marka/discover">
              Influencer ara
            </Link>
            <Link className="btn secondary btn--sm" href="/marka/profile">
              Profili düzenle
            </Link>
          </div>
        }
      />

      <ProfileCompletionCard
        completion={profileCompletion}
        profileHref="/marka/profile"
        businessHref="/marka/discover"
      />

      <div className="overview-page__grid-stats">
        <OverviewStatCard
          href="/marka/offers?tab=gonderilen"
          label="Gönderilen teklifler"
          value={sentOfferCount}
          hint="Influencer’lara gönderdiğiniz teklifler"
          icon={<Send size={18} strokeWidth={1.85} />}
        />
        <OverviewStatCard
          href="/marka/campaigns?tab=aktif"
          label="Aktif kampanyalar"
          value={publishedCampaignCount}
          hint="Kabul edilen tekliflerden oluşan kampanya akışı"
          icon={<Megaphone size={18} strokeWidth={1.85} />}
        />
        <OverviewStatCard
          href="/marka/offers?durum=kabul"
          label="Devam eden iş birlikleri"
          value={pipelineOfferCount}
          hint="Teslim, revize veya kapanış bekleyen işler"
          icon={<Briefcase size={18} strokeWidth={1.85} />}
        />
        <OverviewStatCard
          href="/chat"
          label="Yeni sohbetler"
          value={unreadChatThreads}
          hint="Influencer’lardan gelen yeni mesajlar"
          icon={<Inbox size={18} strokeWidth={1.85} />}
        />
      </div>

      <div className="overview-page__grid-two">
        <OverviewSectionCard title="Son teklifler" footerHref="/marka/offers" footerLabel="Tüm teklifler">
          {!canUseMarketplace ? (
            <EmptyStateCard
              icon={<EmptyGlyphOffer />}
              title="Önce marka profilini tamamla"
              description="Teklif göndermek ve gelen istekleri görmek için şirket profilinizi kaydedin."
            >
              <Link className="btn btn--sm" href="/marka/profile?tab=genel">
                Profili tamamla
              </Link>
            </EmptyStateCard>
          ) : recentOffers.length === 0 ? (
            <EmptyStateCard
              icon={<EmptyGlyphOffer />}
              title="Henüz teklif yok"
              description="Influencer arayıp teklif gönderin veya gelen istekleri Teklifler’de yanıtlayın."
            >
              <Link className="btn secondary btn--sm" href="/marka/discover">
                Influencer ara
              </Link>
            </EmptyStateCard>
          ) : (
            <div>
              {recentOffers.map((o) => (
                <div key={o.id} className="ov-offer-row">
                  <div>
                    <p className="ov-offer-row__title">{o.title}</p>
                    <p className="muted ov-offer-row__sub">
                      {o.influencer?.influencer?.username ?? o.influencer?.name ?? "Influencer"} ·{" "}
                      {o.initiatedBy === "BRAND" ? "Gönderilen" : "Gelen"}
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
          {!canUseMarketplace ? (
            <EmptyStateCard
              icon={<EmptyGlyphChatHistory />}
              title="Sohbetler profil sonrası açılır"
              description="Marka profilinizi kaydedince teklif sohbetleri burada görünür."
            />
          ) : recentChats.length === 0 ? (
            <EmptyStateCard
              icon={<EmptyGlyphChatHistory />}
              title="Henüz sohbet yok"
              description="Teklif gönderdiğinizde veya gelen isteği yanıtladığınızda sohbet burada açılır."
            >
              <Link className="btn secondary btn--sm" href="/marka/discover">
                Influencer ara
              </Link>
            </EmptyStateCard>
          ) : (
            <div>
              {recentChats.map((c) => {
                const last = c.messages[0];
                const infName =
                  c.offer.influencer?.influencer?.username?.trim() ||
                  c.offer.influencer?.name?.trim() ||
                  "Influencer";
                const offerTitle = c.offer.title?.trim() || c.offer.campaignName?.trim() || "İş birliği";
                return (
                  <Link key={c.id} href={`/chat/${c.id}`} className="ov-chat-row">
                    <div>
                      <p className="ov-chat-row__title">{offerTitle}</p>
                      <p className="muted ov-chat-row__sub">{infName}</p>
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
          href="/marka/discover"
          title="Influencer ara"
          description="Uygun içerik üreticisini bulun, profili inceleyin ve teklif gönderin."
          icon={<Compass size={20} strokeWidth={1.75} />}
        />
        <QuickActionCard
          href="/marka/discover"
          title="Yeni teklif oluştur"
          description="Bir profil seçin, kısa brief ve bütçe ile teklif gönderin."
          icon={<Send size={20} strokeWidth={1.75} />}
        />
        <QuickActionCard
          href="/chat"
          title="Sohbetlere git"
          description="Teklif ve teslim konuşmalarını kaldığınız yerden açın."
          icon={<MessageCircle size={20} strokeWidth={1.75} />}
        />
        <QuickActionCard
          href="/marka/campaigns"
          title="Kampanyaları takip et"
          description="Aktif, tamamlanan ve arşivdeki işleri görün."
          icon={<Megaphone size={20} strokeWidth={1.75} />}
        />
      </div>

      {profile?.username?.trim() ? (
        <p className="muted" style={{ marginTop: 16, fontSize: "0.88rem" }}>
          <Link href={`/brand/${encodeURIComponent(profile.username.trim())}`} style={{ fontWeight: 700 }}>
            Herkese açık marka sayfasını görüntüle
          </Link>
        </p>
      ) : null}
    </div>
  );
}
