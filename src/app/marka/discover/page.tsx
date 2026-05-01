import Link from "next/link";
import { Bookmark } from "lucide-react";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import CitySelect from "@/components/CitySelect";
import { DiscoverActiveFilters } from "@/components/marketplace/DiscoverActiveFilters";
import { TrackedDiscoverSubmitButton } from "@/components/marketplace/TrackedDiscoverSubmitButton";
import { DiscoverExploreInfluencers } from "@/components/marketplace/DiscoverExplore";
import { DiscoverySearchQueryField } from "@/components/marketplace/DiscoverySearchQueryField";
import { MarketplaceInfluencerOfferCard } from "@/components/marketplace/MarketplaceInfluencerOfferCard";
import { getCategoryLabel } from "@/lib/categories";
import { searchMatchWhy } from "@/lib/discovery/discoverCardWhy";
import { loadInfluencerDiscoverExplore } from "@/lib/discovery/discoverSections";
import { runInfluencerMarketplaceSearch } from "@/lib/discovery/marketplaceSearchRun";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";
import { parseMarketplaceSearchQuery } from "@/lib/marketplaceTextSearch";
import { prisma } from "@/lib/prisma";
import { EmptyGlyphMagnifyingGlass, EmptyGlyphMapPin } from "@/components/icons/emptyStateGlyphs";

const NEW_JOINED_WINDOW_DAYS = 21;
const POPULAR_FOLLOWER_THRESHOLD = 50_000;

function getDefaultSuggestedWhyLine(row: { createdAt: Date; followerCount: number }): string {
  const ageMs = Date.now() - row.createdAt.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  if (ageDays <= NEW_JOINED_WINDOW_DAYS) return "Yeni katıldı";
  if (row.followerCount >= POPULAR_FOLLOWER_THRESHOLD) return "Popüler profil";
  return "Sizin için önerildi";
}

export default async function MarkaDiscoverPage({
  searchParams,
}: {
  searchParams?: Promise<{
    city?: string;
    categories?: string | string[];
    err?: string;
    q?: string;
  }>;
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
  const canUseMarketplace = Boolean(profile);
  const params = searchParams ? await searchParams : undefined;
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
  const showExploreRail = canUseMarketplace && !q.trim();

  const explorePromise = showExploreRail ? loadInfluencerDiscoverExplore(prisma) : Promise.resolve(null);

  const influencerResultsPromise =
    canUseMarketplace && hasActiveSearch
      ? runInfluencerMarketplaceSearch(prisma, {
          city: city.trim(),
          selectedCategoryKeys,
          q,
          take: 30,
        })
      : Promise.resolve([]);

  const savedInfluencersPromise = prisma.brandSavedInfluencer.findMany({
    where: { brandUserId: user.id },
    select: { influencerUserId: true },
  });

  const [exploreData, influencerResults, savedInfluencerRows] = await Promise.all([
    explorePromise,
    influencerResultsPromise,
    savedInfluencersPromise,
  ]);

  const savedInfluencerUserIds = new Set(savedInfluencerRows.map((r) => r.influencerUserId));
  const savedInfluencerCount = savedInfluencerUserIds.size;
  const suggestedDefaultInfluencers =
    !hasActiveSearch && exploreData
      ? [...exploreData.suggested, ...exploreData.newest]
          .filter((row, idx, arr) => arr.findIndex((x) => x.id === row.id) === idx)
          .slice(0, 10)
      : [];

  return (
    <div className="dashboard-page influencer-panel-page marka-discover">
      <header className="influencer-panel-page__hero discover-page-hero">
        <h1 className="influencer-panel-page__title">Keşfet</h1>
        <p className="influencer-panel-page__lede muted">
          Markanıza uygun içerik üreticilerini arayın, filtreleyin ve teklif gönderin.
        </p>
      </header>

      {!canUseMarketplace ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<EmptyGlyphMagnifyingGlass />}
            hint="Keşfet için profil"
            title="Önce marka profilinizi tamamlayın"
            description="Şirket bilgileriniz olmadan arama ve teklif açılmaz; birkaç alanla hemen başlayabilirsiniz."
          >
            <Link className="btn" href="/marka/profile?tab=genel">
              Profili tamamla
            </Link>
          </EmptyStateCard>
        </section>
      ) : (
        <section
          className="dash-card dash-card--section dash-card--emphasis discovery-search-card"
          id="marka-influencer-ara"
        >
          <header className="discovery-search-card__intro">
            <h2 className="dash-section__title discovery-search-card__title">İçerik üreticisi bul</h2>
            <p className="dash-section__lede muted discovery-search-card__lede">
              İsim, kullanıcı adı, şehir, kategori veya niş alanına göre hızlıca arayın.
            </p>
            <p className="discovery-context-hint muted">
              Daha net sonuçlar için şehir ve kategori filtrelerini ekleyebilirsiniz.
            </p>
          </header>

          <div className="discovery-search-panel">
            <form className="influencer-search-form discovery-search-form" method="get" action="/marka/discover">
              <div className="discovery-search-field discovery-search-field--query">
                <label className="discovery-search-field__label" htmlFor="discovery-query-marka-discover">
                  İsim, kullanıcı adı, kategori veya şehir ara
                </label>
                <DiscoverySearchQueryField
                  id="discovery-query-marka-discover"
                  defaultValue={q}
                  placeholder="örn. zeynep, zeynepbastık, İstanbul, moda…"
                  debouncedAutoSubmitMs={480}
                />
                <p className="discovery-search-field__hint muted discovery-search-field__hint--debounce">
                  Yazmayı bıraktığınızda sonuçlar otomatik yenilenir.
                </p>
              </div>

              <div className="discovery-search-field">
                <label className="discovery-search-field__label" htmlFor="city-marka-discover">
                  Şehir
                </label>
                <div className="influencer-search-form__city discovery-search-field__control--city">
                  <CitySelect
                    id="city-marka-discover"
                    name="city"
                    defaultValue={city}
                    required={false}
                    searchable
                  />
                </div>
              </div>

              <div className="discovery-search-field discovery-search-field--categories">
                <span className="discovery-search-field__label" id="marka-disc-cat-label">
                  Kategori
                </span>
                <div className="discovery-search-field__control" aria-labelledby="marka-disc-cat-label">
                  <CategoryMultiSelect
                    filterable
                    initialSelected={selectedCategoryKeys}
                    inputName="categories"
                  />
                </div>
              </div>

              <div className="discovery-search-field discovery-search-field--sort">
                <label className="discovery-search-field__label" htmlFor="discovery-sort-marka-discover">
                  Sıralama
                </label>
                <select
                  id="discovery-sort-marka-discover"
                  className="discovery-search-sort"
                  disabled
                  aria-disabled="true"
                  title="Yakında"
                >
                  <option>Sıralama seçenekleri yakında</option>
                </select>
                <p className="discovery-search-field__hint muted">
                  Sıralama seçenekleri yakında.
                </p>
              </div>

              <div className="influencer-search-form__actions discovery-search-actions">
                <TrackedDiscoverSubmitButton location="marka_discover" />
                <a className="btn secondary discovery-search-actions__reset" href="/marka/discover">
                  Sıfırla
                </a>
              </div>
            </form>
          </div>

          {hasActiveSearch ? (
            <DiscoverActiveFilters
              basePath="/marka/discover"
              q={q}
              city={city.trim()}
              categoryKeys={selectedCategoryKeys}
            />
          ) : null}

          {showExploreRail && exploreData ? (
            <div id="marka-discover-oneriler">
              <DiscoverExploreInfluencers
                data={exploreData}
                hrefBase="/marka/discover"
                savedInfluencerUserIds={savedInfluencerUserIds}
              />
            </div>
          ) : null}

          <div className="discovery-search-results">
            <h3 className="discovery-search-results__title">Sonuçlar</h3>
            {!hasActiveSearch ? (
              suggestedDefaultInfluencers.length > 0 ? (
                <div className="influencer-results-stack">
                  <header className="discover-results-suggested__head">
                    <h4 className="discovery-search-results__title">Önerilen içerik üreticiler</h4>
                    <p className="dash-section__lede muted">
                      Daha spesifik sonuçlar için arama veya filtreleri kullanın.
                    </p>
                  </header>
                  {suggestedDefaultInfluencers.map((p) => {
                    const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
                    const defaultAmt =
                      p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;
                    return (
                      <MarketplaceInfluencerOfferCard
                        key={p.id}
                        formIdKey={`default-sug-${p.id}`}
                        influencerUserId={p.userId}
                        username={p.username}
                        city={p.city}
                        profileImageUrl={p.profileImageUrl}
                        categoriesLine={categories}
                        whyLine={getDefaultSuggestedWhyLine(p)}
                        followerCount={p.followerCount}
                        basePriceTRY={p.basePriceTRY}
                        nicheText={p.nicheText}
                        nicheTruncateLen={100}
                        initialSaved={savedInfluencerUserIds.has(p.userId)}
                        defaultOfferAmountTRY={defaultAmt}
                        cardClassName="influencer-result-card influencer-result-card--hub"
                        profileLinkLabel="Profili incele"
                        submitButtonLabel="İş birliği isteği gönder"
                        briefRows={3}
                      />
                    );
                  })}
                </div>
              ) : (
                <EmptyStateCard
                  icon={<EmptyGlyphMagnifyingGlass />}
                  hint="Sonraki adım"
                  title="Aramayı başlatın veya filtre seçin"
                  description="Önerilen profillere bakın ya da arama kutusuna birkaç kelime yazın."
                >
                  {showExploreRail && exploreData ? (
                    <a className="btn" href="#marka-discover-oneriler">
                      Önerilenlere göz at
                    </a>
                  ) : (
                    <a className="btn" href="#marka-influencer-ara">
                      Arama formuna git
                    </a>
                  )}
                </EmptyStateCard>
              )
            ) : influencerResults.length === 0 ? (
              <EmptyStateCard
                icon={<EmptyGlyphMapPin />}
                hint="Kriterleri gevşetin"
                title="Sonuç bulunamadı"
                description="Bu kombinasyonda profil yok. Metni kısaltın, kategori veya şehri kaldırın; ardından tekrar deneyin."
              >
                <a className="btn" href="/marka/discover">
                  Filtreleri sıfırla
                </a>
              </EmptyStateCard>
            ) : (
              <div className="influencer-results-stack">
                {influencerResults.map((p) => {
                  const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
                  const defaultAmt =
                    p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;
                  return (
                    <MarketplaceInfluencerOfferCard
                      key={p.id}
                      formIdKey={p.id}
                      influencerUserId={p.userId}
                      username={p.username}
                      city={p.city}
                      profileImageUrl={p.profileImageUrl}
                      categoriesLine={categories}
                      whyLine={searchMatchWhy({
                        literal: p._matchScore,
                        fuzzy: p._fuzzyScore,
                        reason: p._matchReason,
                      })}
                      followerCount={p.followerCount}
                      basePriceTRY={p.basePriceTRY}
                      nicheText={p.nicheText}
                      nicheTruncateLen={100}
                      initialSaved={savedInfluencerUserIds.has(p.userId)}
                      defaultOfferAmountTRY={defaultAmt}
                      cardClassName="influencer-result-card influencer-result-card--hub"
                      profileLinkLabel="Profili incele"
                      submitButtonLabel="İş birliği isteği gönder"
                      briefRows={3}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="dash-card dash-card--section">
        <h2 className="dash-section__title">Kayıtlı içerik üreticileri</h2>
        {savedInfluencerCount === 0 ? (
          <EmptyStateCard
            icon={<Bookmark strokeWidth={1.25} />}
            hint="Teklif öncesi kısayol"
            title="Kayıtlı profil yok"
            description="Beğendiğiniz içerik üreticilerini kart üzerinden kaydedin; teklif yazmadan önce buradan hızlıca açın."
          >
            <Link className="btn" href="/marka/discover#marka-influencer-ara">
              Keşfede profil bul
            </Link>
          </EmptyStateCard>
        ) : (
          <div className="saved-teaser">
            <p className="muted saved-teaser__lede">
              <strong>{savedInfluencerCount}</strong> profil kayıtlı.
            </p>
            <Link className="btn secondary" href="/marka/saved">
              Kayıtlıları görüntüle
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
