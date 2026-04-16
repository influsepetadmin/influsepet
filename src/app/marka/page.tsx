import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { getCurrentUser } from "@/lib/me";
import CitySelect from "@/components/CitySelect";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import { DiscoverySearchQueryField } from "@/components/marketplace/DiscoverySearchQueryField";
import { MarketplaceDiscoverInfluencers } from "@/components/marketplace/MarketplaceDiscoverInfluencers";
import { prisma } from "@/lib/prisma";
import { getCategoryLabel } from "@/lib/categories";
import { truncateText } from "@/lib/dashboardProfileCompletion";
import { getAvatarUrl } from "@/lib/avatar";
import { isBrandDashboardProfileComplete } from "@/lib/dashboardProfileCompletion";
import { BrandProfilePanel } from "@/components/dashboard/BrandProfilePanel";
import { CollaborationCard } from "@/components/offers/CollaborationCard";
import { toCollaborationCardOffer } from "@/components/offers/collaborationCardOffer";
import { getRateeReputationByUserIds } from "@/lib/offers/rateeReputation";
import { getAvailableOfferTransitions } from "@/lib/offers/transitions";
import {
  buildInfluencerMarketplaceWhere,
  buildInfluencerProfileTextWhere,
  parseMarketplaceSearchQuery,
} from "@/lib/marketplaceTextSearch";
import { SocialAccountsSection } from "@/components/social/SocialAccountsSection";
import {
  EmptyGlyphInbox,
  EmptyGlyphMagnifyingGlass,
  EmptyGlyphPaperAirplane,
} from "@/components/icons/emptyStateGlyphs";

const offerDashboardSelect = {
  id: true,
  title: true,
  campaignName: true,
  brief: true,
  offerAmountTRY: true,
  budgetTRY: true,
  commissionRate: true,
  commissionTRY: true,
  netPayoutTRY: true,
  status: true,
  initiatedBy: true,
  brandId: true,
  influencerId: true,
  dueDate: true,
  deliverableType: true,
  deliverableCount: true,
  revisionCount: true,
  createdAt: true,
  updatedAt: true,
  conversation: { select: { id: true } },
  _count: { select: { deliveries: true } },
} as const;

export default async function BrandPage({
  searchParams,
}: {
  searchParams?: Promise<{
    city?: string;
    categories?: string | string[];
    err?: string;
    q?: string;
  }>;
}) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : undefined;
  const err = params?.err;

  if (!user) {
    redirect("/?role=BRAND&mode=login");
  }

  if (user.role === "ADMIN") {
    return (
      <ForbiddenStateCard
        title="Bu alan marka hesapları içindir"
        description="Yönetici hesabıyla bu panel kullanılamaz."
      />
    );
  }

  if (user.role !== "BRAND") {
    return (
      <ForbiddenStateCard
        title="Bu alan marka hesapları içindir"
        description="Şu an influencer hesabıyla giriş yaptınız. Influencer işlemleri için influencer panelini kullanın."
        panelHref="/influencer"
        panelLabel="Influencer paneline git"
      />
    );
  }

  const profile = user.brand;
  const profileComplete = isBrandDashboardProfileComplete(profile);
  const city = params?.city ?? "";
  const q = parseMarketplaceSearchQuery(params?.q);
  const categoriesParam = params?.categories;
  const categoriesArray =
    typeof categoriesParam === "string"
      ? [categoriesParam]
      : Array.isArray(categoriesParam)
        ? categoriesParam
        : [];
  const selectedCategoryKeys = categoriesArray.filter(Boolean).slice(0, 3);
  const hasActiveSearch =
    Boolean(city.trim()) || selectedCategoryKeys.length > 0 || Boolean(q);

  const canUseMarketplace = Boolean(profile);

  const sessionUser = { id: user.id, role: user.role };

  const [socialLinkedCount, pipelineOfferCount, pendingOfferCount] = await Promise.all([
    prisma.socialAccount.count({ where: { userId: user.id, isConnected: true } }),
    canUseMarketplace
      ? prisma.offer.count({
          where: {
            brandId: user.id,
            status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
          },
        })
      : Promise.resolve(0),
    canUseMarketplace
      ? prisma.offer.count({
          where: { brandId: user.id, status: "PENDING" },
        })
      : Promise.resolve(0),
  ]);

  const sentOffers = canUseMarketplace
    ? await prisma.offer.findMany({
        where: { brandId: user.id, initiatedBy: "BRAND" },
        orderBy: { createdAt: "desc" },
        select: {
          ...offerDashboardSelect,
          influencer: {
            select: {
              id: true,
              influencer: { select: { username: true } },
            },
          },
        },
      })
    : [];

  const offersFromInfluencers = canUseMarketplace
    ? await prisma.offer.findMany({
        where: { brandId: user.id, initiatedBy: "INFLUENCER" },
        orderBy: { createdAt: "desc" },
        select: {
          ...offerDashboardSelect,
          influencer: {
            select: {
              id: true,
              name: true,
              influencer: { select: { username: true } },
            },
          },
        },
      })
      : [];

  const collabOffersForReputation = [...offersFromInfluencers, ...sentOffers];
  const completedInfluencerIds = [
    ...new Set(
      collabOffersForReputation.filter((o) => o.status === "COMPLETED").map((o) => o.influencerId),
    ),
  ];
  const rateeReputationByUserId = await getRateeReputationByUserIds(completedInfluencerIds);

  const discoverSelect = {
    id: true,
    userId: true,
    username: true,
    profileImageUrl: true,
    city: true,
    followerCount: true,
    basePriceTRY: true,
    selectedCategories: { select: { categoryKey: true } },
    nicheText: true,
  } as const;

  const influencerSearchWhere = buildInfluencerMarketplaceWhere({
    city: city.trim(),
    selectedCategoryKeys: selectedCategoryKeys,
    textWhere: buildInfluencerProfileTextWhere(q),
  });

  const [influencerResults, discoverInfluencers] = await Promise.all([
    canUseMarketplace && hasActiveSearch
      ? prisma.influencerProfile.findMany({
          where: influencerSearchWhere,
          select: discoverSelect,
          take: 30,
          orderBy: { followerCount: "desc" },
        })
      : Promise.resolve([]),
    canUseMarketplace
      ? prisma.influencerProfile.findMany({
          select: discoverSelect,
          take: 6,
          orderBy: { followerCount: "desc" },
        })
      : Promise.resolve([]),
  ]);

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <div className="dashboard-page__header-main">
          <h1 className="dashboard-page__title">Marka Paneli</h1>
          <p className="dashboard-page__welcome muted">Hoş geldin, {user.name}</p>
          <div className="dashboard-page__stats" aria-label="Özet">
            <div className="brand-stat-chip">
              <span className="brand-stat-chip__value">{pipelineOfferCount}</span>
              <span className="brand-stat-chip__label">Devam eden iş birliği</span>
            </div>
            <div className="brand-stat-chip">
              <span className="brand-stat-chip__value">{pendingOfferCount}</span>
              <span className="brand-stat-chip__label">Bekleyen istek</span>
            </div>
            <div className="brand-stat-chip">
              <span className="brand-stat-chip__value">{socialLinkedCount}</span>
              <span className="brand-stat-chip__label">Bağlı sosyal hesap</span>
            </div>
          </div>
        </div>
        <form className="dashboard-page__logout" action="/api/auth/logout" method="post">
          <button className="btn secondary" type="submit">
            Çıkış
          </button>
        </form>
      </header>

      <section className="dash-card dash-card--section">
        <h2 className="dash-section__title">Profil</h2>
        <BrandProfilePanel
          err={err}
          profileComplete={profileComplete}
          displayName={user.name}
          initial={{
            companyName: profile?.companyName ?? "",
            city: profile?.city ?? "",
            website: profile?.website ?? "",
            profileImageUrl: profile?.profileImageUrl ?? "",
            username: profile?.username ?? "",
            bio: profile?.bio ?? "",
            selectedCategoryKeys: profile?.selectedCategories?.map((c) => c.categoryKey) ?? [],
          }}
          isExistingProfile={Boolean(profile)}
          summary={{
            imageSrc: profile?.profileImageUrl ?? getAvatarUrl(user.id),
            companyName: profile?.companyName ?? "",
            city: profile?.city ?? "",
            websiteUrl: profile?.website?.trim() || null,
            publicUsername: profile?.username?.trim() ? profile.username.trim() : null,
          }}
        />
      </section>

      <SocialAccountsSection />

      {canUseMarketplace && (
        <section className="dash-card dash-card--section">
          <h2 className="dash-section__title">Influencer&apos;dan gelen iş birliği istekleri</h2>
          {offersFromInfluencers.length === 0 ? (
            <EmptyStateCard
              icon={<EmptyGlyphInbox />}
              title="Influencer’dan gelen istek yok"
              description="Influencer’lar size teklif gönderdiğinde burada listelenir."
            >
              <Link className="btn secondary" href="#marka-influencer-ara">
                Influencer ara
              </Link>
            </EmptyStateCard>
          ) : (
            <div className="dash-collab-list">
              {offersFromInfluencers.map((o) => (
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
        </section>
      )}

      {canUseMarketplace && (
        <section
          className="dash-card dash-card--section dash-card--emphasis discovery-search-card"
          id="marka-influencer-ara"
        >
          <header className="discovery-search-card__intro">
            <h2 className="dash-section__title discovery-search-card__title">İçerik üreticisi bul</h2>
            <p className="dash-section__lede muted discovery-search-card__lede">
              Şehir, kategori, kullanıcı adı, görünen ad, niş veya kategori metni ile arayın; kısmi eşleşmeler
              desteklenir.
            </p>
          </header>

          <MarketplaceDiscoverInfluencers items={discoverInfluencers} />

          <div className="discovery-search-panel">
            <form className="influencer-search-form discovery-search-form" method="get" action="/marka">
              <div className="discovery-search-field discovery-search-field--query">
                <label className="discovery-search-field__label" htmlFor="discovery-query-marka">
                  İsim veya kullanıcı adı ara
                </label>
                <DiscoverySearchQueryField id="discovery-query-marka" defaultValue={q} />
              </div>

              <div className="discovery-search-field">
                <label className="discovery-search-field__label" htmlFor="city">
                  Şehir
                </label>
                <div className="influencer-search-form__city discovery-search-field__control--city">
                  <CitySelect id="city" name="city" defaultValue={city} required={false} />
                </div>
              </div>

              <div className="discovery-search-field discovery-search-field--categories">
                <span className="discovery-search-field__label" id="marka-categories-label">
                  Kategori
                </span>
                <div className="discovery-search-field__control" aria-labelledby="marka-categories-label">
                  <CategoryMultiSelect initialSelected={selectedCategoryKeys} inputName="categories" />
                </div>
              </div>

              <div className="discovery-search-field discovery-search-field--sort">
                <label className="discovery-search-field__label" htmlFor="discovery-sort-marka">
                  Sıralama
                </label>
                <select
                  id="discovery-sort-marka"
                  className="discovery-search-sort"
                  disabled
                  aria-disabled="true"
                  title="Yakında"
                >
                  <option>Sıralama seçenekleri yakında</option>
                </select>
                <p className="discovery-search-field__hint muted">
                  Önerilen ve alfabetik sıralama üzerinde çalışıyoruz.
                </p>
              </div>

              <div className="influencer-search-form__actions discovery-search-actions">
                <button className="btn discovery-search-actions__submit" type="submit">
                  Sonuçları göster
                </button>
                <a className="btn secondary discovery-search-actions__reset" href="/marka">
                  Sıfırla
                </a>
              </div>
            </form>
          </div>

          <div className="discovery-search-results">
            <h3 className="discovery-search-results__title">Sonuçlar</h3>
            {!hasActiveSearch ? (
                <EmptyStateCard
                icon={<EmptyGlyphMagnifyingGlass />}
                title="Henüz sonuç yok"
                description="Şehir, kategori veya arama kutusuna metin girerek arama yapabilirsiniz. Yukarıdaki Keşfet bölümünden de örnek profillere göz atabilirsiniz."
              />
            ) : influencerResults.length === 0 ? (
              <EmptyStateCard
                icon={<EmptyGlyphMagnifyingGlass />}
                title="Sonuç bulunamadı"
                description="Bu filtrelere uygun içerik üreticisi bulunamadı. Arama metnini, kullanıcı adını, kategori veya şehir seçimini değiştirip yeniden deneyebilir veya sıfırlayabilirsiniz."
              />
            ) : (
              <div className="influencer-results-stack">
              {influencerResults.map((p) => {
                const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
                return (
                  <article key={p.id} className="influencer-result-card">
                    <div className="influencer-result-card__head">
                      <img
                        className="influencer-result-card__avatar"
                        src={p.profileImageUrl ?? getAvatarUrl(p.userId)}
                        alt=""
                      />
                      <div className="influencer-result-card__identity">
                        <p className="influencer-result-card__name">{p.username}</p>
                        <p className="muted influencer-result-card__city">{p.city ?? "—"}</p>
                      </div>
                      <a className="btn secondary btn--sm" href={`/profil/influencer/${p.userId}`}>
                        Profili incele
                      </a>
                    </div>
                    <p className="muted influencer-result-card__meta">
                      Takipçi: {p.followerCount.toLocaleString("tr-TR")} · Baz fiyat: {p.basePriceTRY} TRY
                    </p>
                    <p className="muted influencer-result-card__meta">
                      Kategoriler: {categories || "—"}
                    </p>
                    {p.nicheText?.trim() ? (
                      <p className="muted influencer-result-card__niche">
                        Niş: {truncateText(p.nicheText.trim(), 100)}
                      </p>
                    ) : null}

                    <form className="influencer-result-card__form" action="/api/offers/create" method="post">
                      <input type="hidden" name="influencerId" value={p.userId} />

                      <label htmlFor={`title-${p.id}`}>Kampanya başlığı</label>
                      <input id={`title-${p.id}`} name="title" type="text" required />

                      <label htmlFor={`brief-${p.id}`}>Kısa açıklama</label>
                      <textarea id={`brief-${p.id}`} name="brief" required rows={3} />

                      <label htmlFor={`amt-${p.id}`}>İş birliği bütçesi (TRY)</label>
                      <input
                        id={`amt-${p.id}`}
                        name="offerAmountTRY"
                        type="number"
                        required
                        min={100}
                        step={100}
                        defaultValue={
                          p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100
                        }
                      />

                      <button className="btn" type="submit">
                        İş birliği isteği gönder
                      </button>
                    </form>
                  </article>
                );
              })}
            </div>
            )}
          </div>
        </section>
      )}

      {canUseMarketplace && (
        <section className="dash-card dash-card--section">
          <h2 className="dash-section__title">Influencer&apos;lara gönderdiğin iş birliği istekleri</h2>
          {sentOffers.length === 0 ? (
            <EmptyStateCard
              icon={<EmptyGlyphPaperAirplane />}
              title="Henüz gönderdiğiniz istek yok"
              description="Influencer araması yaparak iş birliği teklifi oluşturabilirsiniz."
            >
              <Link className="btn secondary" href="#marka-influencer-ara">
                Influencer ara
              </Link>
            </EmptyStateCard>
          ) : (
            <div className="dash-collab-list">
              {sentOffers.map((o) => (
                <CollaborationCard
                  key={o.id}
                  offer={toCollaborationCardOffer(o)}
                  otherSideLabel="Influencer"
                  otherSideName={o.influencer?.influencer?.username ?? "-"}
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
        </section>
      )}
    </div>
  );
}
