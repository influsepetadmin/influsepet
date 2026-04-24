import Link from "next/link";
import type { OfferStatus } from "@prisma/client";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { ShellControlBar, ShellPanelHint, ShellTabLink, ShellTabsRow } from "@/components/app-shell/ShellPanelControls";
import { CollaborationCard } from "@/components/offers/CollaborationCard";
import { toCollaborationCardOffer } from "@/components/offers/collaborationCardOffer";
import { getRateeReputationByUserIds } from "@/lib/offers/rateeReputation";
import { getAvailableOfferTransitions } from "@/lib/offers/transitions";
import { BRAND_OFFER_WITH_INFLUENCER_SELECT } from "@/lib/marka/markaOfferDashboard";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";
import { prisma } from "@/lib/prisma";
import { EmptyGlyphBuildingOffice, EmptyGlyphInbox } from "@/components/icons/emptyStateGlyphs";

const TAB_CONFIG: {
  key: string;
  label: string;
  statuses: OfferStatus[] | "placeholder";
}[] = [
  { key: "aktif", label: "Aktif", statuses: ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"] },
  { key: "taslak", label: "Taslak / bekleyen", statuses: "placeholder" },
  { key: "tamamlanan", label: "Tamamlanan", statuses: ["COMPLETED"] },
  { key: "arsiv", label: "Arşiv", statuses: ["REJECTED", "CANCELLED"] },
];

function parseCampaignTab(raw: string | undefined): string {
  const valid = TAB_CONFIG.some((t) => t.key === raw);
  return valid && raw ? raw : "aktif";
}

function tabCountsFromGroup(
  rows: { status: OfferStatus; _count: { _all: number } }[],
): Record<string, number> {
  const m = Object.fromEntries(rows.map((r) => [r.status, r._count._all])) as Partial<Record<OfferStatus, number>>;
  const sum = (statuses: OfferStatus[]) => statuses.reduce((a, s) => a + (m[s] ?? 0), 0);
  return {
    aktif: sum(["ACCEPTED", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"]),
    taslak: 0,
    tamamlanan: m["COMPLETED"] ?? 0,
    arsiv: (m["REJECTED"] ?? 0) + (m["CANCELLED"] ?? 0),
  };
}

export default async function MarkaCampaignsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
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
  const sp = searchParams ? await searchParams : {};
  const tabKey = parseCampaignTab(sp.tab);
  const tabDef = TAB_CONFIG.find((t) => t.key === tabKey) ?? TAB_CONFIG[0]!;

  const sessionUser = { id: user.id, role: user.role };

  const [offers, statusGroups, completedIdRows] = await Promise.all([
    profile && tabDef.statuses !== "placeholder"
      ? prisma.offer.findMany({
          where: {
            brandId: user.id,
            status: { in: tabDef.statuses },
          },
          orderBy: { updatedAt: "desc" },
          select: BRAND_OFFER_WITH_INFLUENCER_SELECT,
        })
      : [],
    profile
      ? prisma.offer.groupBy({
          by: ["status"],
          where: { brandId: user.id },
          _count: { _all: true },
        })
      : [],
    profile
      ? prisma.offer.findMany({
          where: { brandId: user.id, status: "COMPLETED" },
          select: { influencerId: true },
        })
      : [],
  ]);

  const tabCounts = profile ? tabCountsFromGroup(statusGroups) : { aktif: 0, taslak: 0, tamamlanan: 0, arsiv: 0 };
  const completedInfluencerIds = [...new Set(completedIdRows.map((o) => o.influencerId))];
  const rateeReputationByUserId = await getRateeReputationByUserIds(completedInfluencerIds);

  const tabHref = (k: string) => (k === "aktif" ? "/marka/campaigns" : `/marka/campaigns?tab=${encodeURIComponent(k)}`);

  const headerAction = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
      <Link className="btn btn--sm" href="/marka/discover">
        Influencer keşfet
      </Link>
      <Link className="btn secondary btn--sm" href="/marka/offers">
        Teklifler
      </Link>
    </div>
  );

  return (
    <div className="dashboard-page shell-panel-page marka-campaigns">
      <PageHeader
        eyebrow="Campaigns"
        title="Kampanyalar"
        description="Tekliflerinizden türetilen süreç görünümü; ileride bağımsız kampanya kayıtları buraya bağlanacak."
        action={headerAction}
      />

      {!profile ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<EmptyGlyphBuildingOffice />}
            hint="Kampanyalar için profil"
            title="Marka profili gerekli"
            description="Özet ve listeler şirket profilinize bağlıdır. Önce genel sekmesini doldurun."
          >
            <Link className="btn" href="/marka/profile?tab=genel">
              Profili tamamla
            </Link>
          </EmptyStateCard>
        </section>
      ) : (
        <>
          <ShellControlBar>
            <ShellTabsRow aria-label="Kampanya görünümü">
              {TAB_CONFIG.map((t) => (
                <ShellTabLink
                  key={t.key}
                  href={tabHref(t.key)}
                  active={tabKey === t.key}
                  count={tabCounts[t.key] ?? 0}
                >
                  {t.label}
                </ShellTabLink>
              ))}
            </ShellTabsRow>
          </ShellControlBar>

          {tabDef.statuses === "placeholder" ? (
            <section className="dash-card dash-card--section">
              <EmptyStateCard
                icon={<EmptyGlyphBuildingOffice />}
                hint="Yakında"
                title="Taslak kampanyalar yakında"
                description="Şimdilik teklif oluşturup aktif sekmeden süreci yönetin; bu sekme ileride dolar."
              >
                <Link className="btn" href="/marka/discover">
                  Influencer keşfet
                </Link>
              </EmptyStateCard>
            </section>
          ) : offers.length === 0 ? (
            <>
              <ShellPanelHint>
                {tabKey === "aktif" && "Devam eden üretim ve teslim aşamaları; sohbet ve kart aksiyonlarıyla ilerleyin."}
                {tabKey === "tamamlanan" && "Tamamlanan iş birlikleri; raporlama ve arşiv için referans."}
                {tabKey === "arsiv" && "Reddedilen veya iptal edilen kayıtlar."}
              </ShellPanelHint>
              <section className="dash-card dash-card--section">
                <EmptyStateCard
                  icon={<EmptyGlyphInbox />}
                  hint={tabKey === "aktif" ? "İlk iş birliğini başlat" : undefined}
                  title={
                    tabKey === "aktif"
                      ? "Aktif süreçte kayıt yok"
                      : tabKey === "tamamlanan"
                        ? "Tamamlanan iş birliği yok"
                        : "Arşivde kayıt yok"
                  }
                  description={
                    tabKey === "aktif"
                      ? "Kabul sonrası süreçler burada listelenir. Keşfet’ten teklif gönderin veya Teklifler’den gelen isteği yanıtlayın."
                      : tabKey === "tamamlanan"
                        ? "Tamamlanan iş birlikleri zamanla burada birikir."
                        : "İptal veya red sonrası kayıtlar bu sekmede tutulur."
                  }
                >
                  <Link className="btn" href="/marka/discover">
                    Influencer keşfet
                  </Link>
                </EmptyStateCard>
              </section>
            </>
          ) : (
            <>
              <ShellPanelHint>
                {tabKey === "aktif" && "Aktif süreçleriniz; teslim ve mesajlaşma için sohbete geçebilirsiniz."}
                {tabKey === "tamamlanan" && "Tamamlanan kayıtlar; gerekirse teklifler sayfasından detay açın."}
                {tabKey === "arsiv" && "Kapalı veya iptal süreçler; yeni iş birliği için Keşfet’i kullanın."}
              </ShellPanelHint>
              <div className="dash-collab-list shell-list-stack">
                {offers.map((o) => (
                  <CollaborationCard
                    key={o.id}
                    offer={toCollaborationCardOffer(o)}
                    otherSideLabel="Influencer"
                    otherSideName={o.influencer?.influencer?.username ?? o.influencer?.name ?? "-"}
                    profileHref={o.influencer?.id ? `/profil/influencer/${o.influencer.id}` : null}
                    chatHref={o.conversation?.id ? `/chat/${o.conversation.id}` : null}
                    counterpartyRating={rateeReputationByUserId.get(o.influencerId) ?? null}
                    availableNextTransitions={getAvailableOfferTransitions({
                      offer: {
                        id: o.id,
                        status: o.status,
                        brandId: o.brandId,
                        influencerId: o.influencerId,
                        initiatedBy: o.initiatedBy,
                      },
                      sessionUser,
                    })}
                  />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
