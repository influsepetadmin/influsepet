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
import { EmptyGlyphOffer, EmptyGlyphPaperAirplane } from "@/components/icons/emptyStateGlyphs";

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
    <div className="dashboard-page__actions">
      <Link className="btn btn--sm" href="/marka/discover">
        Influencer ara
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
        description="Influencer’lardan gelen istekleri yanıtlayın, gönderdiğiniz teklifleri takip edin."
        action={headerAction}
      />

      {!profile ? (
        <section className="dash-card dash-card--section dashboard-empty-section">
          <EmptyStateCard
            icon={<EmptyGlyphPaperAirplane />}
            hint="Teklifler için profil"
            title="Önce marka profilinizi tamamlayın"
            description="Şirket profiliniz olmadan teklif listesi açılmaz; genel bilgileri kaydederek devam edin."
          >
            <Link className="btn" href="/marka/profile?tab=genel">
              Profili tamamla
            </Link>
          </EmptyStateCard>
        </section>
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
              ? "Influencer’lar işi üstlenmek için teklif gönderir; kabul, ret veya sohbet aksiyonları kartın içinde."
              : "Seçtiğiniz içerik üreticilerine gönderdiğiniz tekliflerin yanıt ve sohbet durumu burada."}
          </ShellPanelHint>

          {filtered.length === 0 ? (
            <section className="dash-card dash-card--section dashboard-empty-section">
              <EmptyStateCard
                icon={tab === "gelen" ? <EmptyGlyphOffer /> : <EmptyGlyphPaperAirplane />}
                hint={
                  tabSourceList.length === 0 && durumKey === "tumu"
                    ? tab === "gelen"
                      ? "Gelen teklif bekleniyor"
                      : "İlk teklifini gönder"
                    : durumKey !== "tumu"
                      ? "Filtreyi genişletin"
                      : undefined
                }
                title={tab === "gelen" ? "Bu görünümde teklif yok" : "Gönderilen teklif bulunmuyor"}
                description={
                  tab === "gelen"
                    ? durumKey !== "tumu"
                      ? "Seçili duruma uyan kayıt yok. Tüm durumları göstererek listeyi açın."
                      : "Influencer’lar size iş birliği isteği gönderdiğinde burada listelenir. Bu sırada influencer arayıp teklif gönderebilirsiniz."
                    : durumKey !== "tumu"
                      ? "Bu durumda gönderilmiş teklif yok. Filtreyi sıfırlayın."
                      : "Profil kartından teklif formunu doldurun; yanıt ve sohbet durumu burada güncellenir."
                }
              >
                {durumKey !== "tumu" ? (
                  <Link className="btn" href={tabLink(tab, "tumu")}>
                    Tüm durumları göster
                  </Link>
                ) : (
                  <Link className="btn" href="/marka/discover">
                    Influencer ara
                  </Link>
                )}
              </EmptyStateCard>
            </section>
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
                  viewerRole="BRAND"
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
