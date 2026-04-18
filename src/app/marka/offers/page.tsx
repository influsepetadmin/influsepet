import Link from "next/link";
import type { OfferStatus } from "@prisma/client";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import {
  ShellControlBar,
  ShellFilterChipLink,
  ShellFiltersBlock,
  ShellPanelHint,
  ShellTabLink,
  ShellTabsRow,
} from "@/components/app-shell/ShellPanelControls";
import { CollaborationCard } from "@/components/offers/CollaborationCard";
import { toCollaborationCardOffer } from "@/components/offers/collaborationCardOffer";
import { getRateeReputationByUserIds } from "@/lib/offers/rateeReputation";
import { getAvailableOfferTransitions } from "@/lib/offers/transitions";
import { BRAND_OFFER_WITH_INFLUENCER_SELECT } from "@/lib/marka/markaOfferDashboard";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";
import { buildOfferTabHref } from "@/lib/panel/offerTabHref";
import { countOffersByStatusFilter } from "@/lib/panel/offerFilterCounts";
import { prisma } from "@/lib/prisma";
import { EmptyGlyphInbox, EmptyGlyphPaperAirplane } from "@/components/icons/emptyStateGlyphs";

const STATUS_FILTER: { key: string; label: string; match: OfferStatus[] | null }[] = [
  { key: "tumu", label: "Tümü", match: null },
  { key: "bekleyen", label: "Bekleyen", match: ["PENDING"] },
  { key: "kabul", label: "Kabul / devam", match: ["ACCEPTED", "IN_PROGRESS", "DELIVERED", "REVISION_REQUESTED"] },
  { key: "reddedilen", label: "Reddedilen / iptal", match: ["REJECTED", "CANCELLED"] },
];

function parseTab(raw: string | undefined): "gelen" | "gonderilen" {
  return raw === "gonderilen" ? "gonderilen" : "gelen";
}

export default async function MarkaOffersPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; durum?: string }>;
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
  const tab = parseTab(sp.tab);
  const durumKey = sp.durum ?? "tumu";
  const statusRule = STATUS_FILTER.find((s) => s.key === durumKey) ?? STATUS_FILTER[0]!;

  const sessionUser = { id: user.id, role: user.role };

  const [offersFromInfluencers, sentOffers] = profile
    ? await Promise.all([
        prisma.offer.findMany({
          where: { brandId: user.id, initiatedBy: "INFLUENCER" },
          orderBy: { createdAt: "desc" },
          select: BRAND_OFFER_WITH_INFLUENCER_SELECT,
        }),
        prisma.offer.findMany({
          where: { brandId: user.id, initiatedBy: "BRAND" },
          orderBy: { createdAt: "desc" },
          select: BRAND_OFFER_WITH_INFLUENCER_SELECT,
        }),
      ])
    : [[], []];

  const collabOffersForReputation = [...offersFromInfluencers, ...sentOffers];
  const completedInfluencerIds = [
    ...new Set(
      collabOffersForReputation.filter((o) => o.status === "COMPLETED").map((o) => o.influencerId),
    ),
  ];
  const rateeReputationByUserId = await getRateeReputationByUserIds(completedInfluencerIds);

  const tabSourceList = tab === "gelen" ? offersFromInfluencers : sentOffers;
  const filtered =
    statusRule.match == null ? tabSourceList : tabSourceList.filter((o) => statusRule.match!.includes(o.status));

  const tabLink = (t: "gelen" | "gonderilen", d: string) => buildOfferTabHref("/marka/offers", t, d);

  const headerAction = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
      <Link className="btn btn--sm" href="/marka/discover">
        Influencer keşfet
      </Link>
      <Link className="btn secondary btn--sm" href="/chat">
        Sohbetler
      </Link>
    </div>
  );

  return (
    <div className="dashboard-page shell-panel-page marka-offers">
      <PageHeader
        eyebrow="Offers"
        title="Teklifler"
        description="Influencer’ların gönderdiği istekler ile marka olarak başlattığınız teklifler."
        action={headerAction}
      />

      {!profile ? (
        <EmptyStateCard
          icon={<EmptyGlyphPaperAirplane />}
          title="Önce marka profilinizi tamamlayın"
          description="Teklif listesi ve oluşturma için şirket bilgilerinizin kayıtlı olması gerekir. Birkaç dakikada profilinizi oluşturabilirsiniz."
        >
          <Link className="btn" href="/marka/profile?tab=genel">
            Profile git
          </Link>
        </EmptyStateCard>
      ) : (
        <>
          <ShellControlBar>
            <ShellTabsRow aria-label="Teklif kaynağı">
              <ShellTabLink href={tabLink("gelen", durumKey)} active={tab === "gelen"} count={offersFromInfluencers.length}>
                Gelen teklifler
              </ShellTabLink>
              <ShellTabLink href={tabLink("gonderilen", durumKey)} active={tab === "gonderilen"} count={sentOffers.length}>
                Gönderilen teklifler
              </ShellTabLink>
            </ShellTabsRow>
            <ShellFiltersBlock filterLabel="Durum">
              {STATUS_FILTER.map((s) => (
                <ShellFilterChipLink
                  key={s.key}
                  href={tabLink(tab, s.key)}
                  active={durumKey === s.key}
                  label={s.label}
                  count={countOffersByStatusFilter(tabSourceList, s.key)}
                />
              ))}
            </ShellFiltersBlock>
          </ShellControlBar>

          <ShellPanelHint>
            {tab === "gelen"
              ? "Influencer’ların size ilettiği iş birliği özetleri; kabul veya red için kart üzerinden ilerleyin."
              : "Keşfet üzerinden seçtiğiniz içerik üreticilerine gönderdiğiniz tekliflerin durumu."}
          </ShellPanelHint>

          {filtered.length === 0 ? (
            <EmptyStateCard
              icon={tab === "gelen" ? <EmptyGlyphInbox /> : <EmptyGlyphPaperAirplane />}
              title={tab === "gelen" ? "Bu görünümde teklif yok" : "Gönderilen teklif bulunmuyor"}
              description={
                tab === "gelen"
                  ? durumKey !== "tumu"
                    ? "Seçili duruma uyan kayıt yok. Filtreyi genişletin veya influencer isteklerini bekleyin."
                    : "Influencer’lar size teklif gönderdiğinde burada listelenir. Keşfet ile profilleri inceleyebilirsiniz."
                  : durumKey !== "tumu"
                    ? "Bu durumda gönderilmiş teklif yok. Filtreyi değiştirin veya Keşfet’ten yeni teklif oluşturun."
                    : "İçerik üreticisi seçip form doldurarak ilk teklifinizi gönderin."
              }
            >
              <Link className="btn" href="/marka/discover">
                Influencer keşfet
              </Link>
            </EmptyStateCard>
          ) : (
            <div className="dash-collab-list shell-list-stack">
              {filtered.map((o) => (
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
          )}
        </>
      )}
    </div>
  );
}
