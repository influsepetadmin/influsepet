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
import { INFLUENCER_OFFER_WITH_BRAND_SELECT } from "@/lib/influencer/influencerOfferDashboard";
import { getInfluencerPanelAccess } from "@/lib/influencer/panelAccess";
import { prisma } from "@/lib/prisma";
import { EmptyGlyphInbox } from "@/components/icons/emptyStateGlyphs";

const TAB_CONFIG: {
  key: string;
  label: string;
  statuses: OfferStatus[];
}[] = [
  { key: "aktif", label: "Aktif", statuses: ["ACCEPTED", "IN_PROGRESS"] },
  { key: "teslim", label: "Teslim bekleyenler", statuses: ["DELIVERED"] },
  { key: "tamamlanan", label: "Tamamlananlar", statuses: ["COMPLETED"] },
  { key: "revize", label: "Revize istenenler", statuses: ["REVISION_REQUESTED"] },
];

function parseCollabTab(raw: string | undefined): string {
  const valid = TAB_CONFIG.some((t) => t.key === raw);
  return valid && raw ? raw : "aktif";
}

function countInTab(offers: { status: OfferStatus }[], statuses: OfferStatus[]): number {
  return offers.filter((o) => statuses.includes(o.status)).length;
}

export default async function InfluencerCollaborationsPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string }>;
}) {
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
        description="Şu an marka hesabıyla giriş yaptınız."
        panelHref="/marka"
        panelLabel="Marka paneline git"
      />
    );
  }

  const { user } = access;
  const profile = user.influencer;
  const sp = searchParams ? await searchParams : {};
  const tabKey = parseCollabTab(sp.tab);
  const tabDef = TAB_CONFIG.find((t) => t.key === tabKey) ?? TAB_CONFIG[0]!;

  const sessionUser = { id: user.id, role: user.role };

  const allOffers = profile
    ? await prisma.offer.findMany({
        where: { influencerId: user.id },
        orderBy: { updatedAt: "desc" },
        select: INFLUENCER_OFFER_WITH_BRAND_SELECT,
      })
    : [];

  const filtered = allOffers.filter((o) => tabDef.statuses.includes(o.status));
  const noOffersEver = allOffers.length === 0;

  const completedBrandIds = [
    ...new Set(allOffers.filter((o) => o.status === "COMPLETED").map((o) => o.brandId)),
  ];
  const rateeReputationByUserId = await getRateeReputationByUserIds(completedBrandIds);

  const tabHref = (k: string) =>
    k === "aktif" ? "/influencer/collaborations" : `/influencer/collaborations?tab=${encodeURIComponent(k)}`;

  const headerAction = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
      <Link className="btn btn--sm" href="/influencer/offers">
        Teklifler
      </Link>
      <Link className="btn secondary btn--sm" href="/influencer/discover">
        Keşfet
      </Link>
    </div>
  );

  return (
    <div className="dashboard-page shell-panel-page influencer-collaborations">
      <PageHeader
        eyebrow="Collaborations"
        title="İş birlikleri"
        description="Kabul sonrası süreçler: üretim, teslim, revize ve kapanış. Yeni gelen istekler Teklifler’de."
        action={headerAction}
      />

      <ShellControlBar>
        <ShellTabsRow aria-label="İş birliği aşaması">
          {TAB_CONFIG.map((t) => (
            <ShellTabLink
              key={t.key}
              href={tabHref(t.key)}
              active={tabKey === t.key}
              count={countInTab(allOffers, t.statuses)}
            >
              {t.label}
            </ShellTabLink>
          ))}
        </ShellTabsRow>
      </ShellControlBar>

      <ShellPanelHint>
        {tabKey === "aktif" && "Üzerinde çalışılan anlaşmalar; teslim ve mesajlaşma için sohbete geçin."}
        {tabKey === "teslim" && "İnceleme veya onay bekleyen teslimler."}
        {tabKey === "tamamlanan" && "Kapanmış iş birlikleri ve ödeme süreçleri."}
        {tabKey === "revize" && "Revize talebi açık kayıtlar; marka geri bildirimini kart üzerinden takip edin."}
      </ShellPanelHint>

      {filtered.length === 0 ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<EmptyGlyphInbox />}
            hint={
              noOffersEver
                ? "İlk iş birliğini başlat"
                : tabKey === "aktif"
                  ? undefined
                  : "Bu sekmede henüz kayıt yok"
            }
            title={
              noOffersEver && tabKey === "aktif"
                ? "Henüz iş birliği yok"
                : tabKey === "aktif"
                  ? "Aktif süreçte kayıt yok"
                  : tabKey === "tamamlanan"
                    ? "Henüz tamamlanan iş birliği yok"
                    : "Bu aşamada kayıt yok"
            }
            description={
              noOffersEver && tabKey === "aktif"
                ? "Kabul edilmiş bir teklif olunca süreçler burada görünür. Önce marka bulup teklif gönderin veya gelen teklifi yanıtlayın."
                : tabKey === "aktif"
                  ? "Kabul sonrası üretim veya teslim aşamasındaki kayıtlar burada listelenir. Açık teklifleriniz için Teklifler’e bakın."
                  : tabKey === "teslim"
                    ? "Teslim bekleyen aşamaya geçen iş birliği olunca burada görünür."
                    : tabKey === "tamamlanan"
                      ? "Tamamlanan iş birlikleri zamanla burada birikir."
                      : "Revize istenen teklifler bu sekmede toplanır."
            }
          >
            <Link className="btn" href={noOffersEver && tabKey === "aktif" ? "/influencer/discover" : "/influencer/offers"}>
              {noOffersEver && tabKey === "aktif" ? "Marka keşfet" : "Tekliflere git"}
            </Link>
          </EmptyStateCard>
        </section>
      ) : (
        <div className="dash-collab-list shell-list-stack">
          {filtered.map((o) => (
            <CollaborationCard
              key={o.id}
              offer={toCollaborationCardOffer(o)}
              otherSideLabel="Marka"
              otherSideName={o.brand?.brand?.companyName ?? o.brand?.name ?? "-"}
              profileHref={o.brand?.id ? `/profil/marka/${o.brand.id}` : null}
              chatHref={o.conversation?.id ? `/chat/${o.conversation.id}` : null}
              counterpartyRating={rateeReputationByUserId.get(o.brandId) ?? null}
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
      )}
    </div>
  );
}
