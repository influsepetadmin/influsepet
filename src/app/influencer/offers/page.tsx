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
import { INFLUENCER_OFFER_WITH_BRAND_SELECT } from "@/lib/influencer/influencerOfferDashboard";
import { getInfluencerPanelAccess } from "@/lib/influencer/panelAccess";
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

export default async function InfluencerOffersPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; durum?: string }>;
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
  const tab = parseTab(sp.tab);
  const durumKey = sp.durum ?? "tumu";
  const statusRule = STATUS_FILTER.find((s) => s.key === durumKey) ?? STATUS_FILTER[0]!;

  const sessionUser = { id: user.id, role: user.role };

  const [receivedOffers, sentOffersToBrands] = profile
    ? await Promise.all([
        prisma.offer.findMany({
          where: { influencerId: user.id, initiatedBy: "BRAND" },
          orderBy: { createdAt: "desc" },
          select: INFLUENCER_OFFER_WITH_BRAND_SELECT,
        }),
        prisma.offer.findMany({
          where: { influencerId: user.id, initiatedBy: "INFLUENCER" },
          orderBy: { createdAt: "desc" },
          select: INFLUENCER_OFFER_WITH_BRAND_SELECT,
        }),
      ])
    : [[], []];

  const collabOffersForReputation = [...receivedOffers, ...sentOffersToBrands];
  const completedBrandIds = [
    ...new Set(
      collabOffersForReputation.filter((o) => o.status === "COMPLETED").map((o) => o.brandId),
    ),
  ];
  const rateeReputationByUserId = await getRateeReputationByUserIds(completedBrandIds);

  const tabSourceList = tab === "gelen" ? receivedOffers : sentOffersToBrands;
  const filtered =
    statusRule.match == null
      ? tabSourceList
      : tabSourceList.filter((o) => statusRule.match!.includes(o.status));

  const tabLink = (t: "gelen" | "gonderilen", d: string) =>
    buildOfferTabHref("/influencer/offers", t, d);

  const headerAction = (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", justifyContent: "flex-end" }}>
      <Link className="btn btn--sm" href="/influencer/discover">
        Keşfet
      </Link>
      <Link className="btn secondary btn--sm" href="/chat">
        Sohbetler
      </Link>
    </div>
  );

  return (
    <div className="dashboard-page shell-panel-page influencer-offers">
      <PageHeader
        eyebrow="Offers"
        title="Teklifler"
        description="Markalardan gelen istekler ile sizin gönderdiğiniz teklifler; duruma göre süzülebilir."
        action={headerAction}
      />

      <ShellControlBar>
        <ShellTabsRow aria-label="Teklif kaynağı">
          <ShellTabLink href={tabLink("gelen", durumKey)} active={tab === "gelen"} count={receivedOffers.length}>
            Gelen teklifler
          </ShellTabLink>
          <ShellTabLink
            href={tabLink("gonderilen", durumKey)}
            active={tab === "gonderilen"}
            count={sentOffersToBrands.length}
          >
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
          ? "Markaların size ilettiği kampanya ve bütçe özetleri; yanıt veya sohbet için karta geçin."
          : "Sizin başlattığınız iş birliği istekleri; durum güncellemeleri burada toplanır."}
      </ShellPanelHint>

      {filtered.length === 0 ? (
        <EmptyStateCard
          icon={tab === "gelen" ? <EmptyGlyphInbox /> : <EmptyGlyphPaperAirplane />}
          title={tab === "gelen" ? "Bu görünümde teklif yok" : "Gönderilen teklif bulunmuyor"}
          description={
            tab === "gelen"
              ? durumKey !== "tumu"
                ? "Seçili duruma uyan kayıt yok. Filtreyi genişletin veya markalardan gelen yeni istekleri bekleyin."
                : "Henüz marka tarafından size teklif gelmedi. Keşfet üzerinden marka bularak iletişim kurabilirsiniz."
              : durumKey !== "tumu"
                ? "Bu durumda gönderilmiş teklif yok. Filtreyi değiştirin veya yeni teklif oluşturun."
                : "Marka keşfet sayfasından teklif formu doldurarak ilk isteğinizi gönderebilirsiniz."
          }
        >
          <Link className="btn" href="/influencer/discover">
            Marka keşfet
          </Link>
        </EmptyStateCard>
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
