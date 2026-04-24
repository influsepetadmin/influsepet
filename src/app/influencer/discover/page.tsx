import Link from "next/link";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import CitySelect from "@/components/CitySelect";
import { DiscoverActiveFilters } from "@/components/marketplace/DiscoverActiveFilters";
import { TrackedDiscoverSubmitButton } from "@/components/marketplace/TrackedDiscoverSubmitButton";
import { DiscoverExploreBrands } from "@/components/marketplace/DiscoverExplore";
import { DiscoverySearchQueryField } from "@/components/marketplace/DiscoverySearchQueryField";
import { MarketplaceBrandOfferCard } from "@/components/marketplace/MarketplaceBrandOfferCard";
import { getCategoryLabel } from "@/lib/categories";
import { searchMatchWhy } from "@/lib/discovery/discoverCardWhy";
import { loadBrandDiscoverExplore } from "@/lib/discovery/discoverSections";
import { runBrandMarketplaceSearch } from "@/lib/discovery/marketplaceSearchRun";
import { getInfluencerPanelAccess } from "@/lib/influencer/panelAccess";
import { parseMarketplaceSearchQuery } from "@/lib/marketplaceTextSearch";
import { prisma } from "@/lib/prisma";
import { Bookmark } from "lucide-react";
import {
  EmptyGlyphBuildingOffice,
  EmptyGlyphMapPin,
} from "@/components/icons/emptyStateGlyphs";

export default async function InfluencerDiscoverPage({
  searchParams,
}: {
  searchParams?: Promise<{ city?: string; q?: string; categories?: string | string[] }>;
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
  const params = searchParams ? await searchParams : undefined;
  const city = (params?.city ?? "").trim();
  const q = parseMarketplaceSearchQuery(params?.q);
  const categoriesParam = params?.categories;
  const categoriesArray =
    typeof categoriesParam === "string"
      ? [categoriesParam]
      : Array.isArray(categoriesParam)
        ? categoriesParam
        : [];
  const selectedCategoryKeys = categoriesArray.filter(Boolean).slice(0, 3);
  const hasBrandSearch = Boolean(city) || Boolean(q) || selectedCategoryKeys.length > 0;
  const showExploreRail = Boolean(profile) && !q.trim();

  const explorePromise = showExploreRail ? loadBrandDiscoverExplore(prisma) : Promise.resolve(null);

  const brandResultsPromise =
    profile && hasBrandSearch
      ? runBrandMarketplaceSearch(prisma, {
          city,
          selectedCategoryKeys,
          q,
          take: 30,
        })
      : Promise.resolve([]);

  const savedBrandsPromise = prisma.influencerSavedBrand.findMany({
    where: { influencerUserId: user.id },
    select: { brandUserId: true },
  });

  const [exploreData, brandResults, savedBrandRows] = await Promise.all([
    explorePromise,
    brandResultsPromise,
    savedBrandsPromise,
  ]);

  const savedBrandUserIds = new Set(savedBrandRows.map((r) => r.brandUserId));
  const savedBrandCount = savedBrandUserIds.size;

  return (
    <div className="dashboard-page influencer-panel-page influencer-discover">
      <header className="influencer-panel-page__hero discover-page-hero">
        <h1 className="influencer-panel-page__title">Keşfet</h1>
        <p className="influencer-panel-page__lede muted">
          Tek kutuda veya şehir / kategori ile: firma adı, marka kullanıcı adı, hesap adı, şehir, kategori ve açıklama
          için metin eşleşmesi (Türkçe büyük/küçük harf ve birleşik yazım destekli). Uzun sorgularda hafif yazım
          toleransı vardır; güçlü tam/kısmi eşleşmeler önceliklidir. Birden fazla kelimede her kelime ayrı ayrı
          eşleşmelidir.
        </p>
      </header>

      {profile ? (
        <section
          className="dash-card dash-card--section dash-card--emphasis discovery-search-card"
          id="influencer-marka-ara"
        >
          <header className="discovery-search-card__intro">
            <h2 className="dash-section__title discovery-search-card__title">Marka bul</h2>
            <p className="dash-section__lede muted discovery-search-card__lede">
              Şehir, kategori veya metin ile daraltın; yakın yazımlar ve kısmi eşleşmeler desteklenir.
            </p>
            <p className="discovery-context-hint muted">
              Sonuç çıkmazsa kriterleri tek tek gevşetin; ardından <strong>Sonuçları göster</strong> ile yenileyin.
            </p>
          </header>

          <div className="discovery-search-panel">
            <form className="influencer-search-form discovery-search-form" method="get" action="/influencer/discover">
              <div className="discovery-search-field discovery-search-field--query">
                <label className="discovery-search-field__label" htmlFor="discovery-query-influencer-discover">
                  Firma adı, kullanıcı adı, kategori veya şehir (metin)
                </label>
                <DiscoverySearchQueryField
                  id="discovery-query-influencer-discover"
                  defaultValue={q}
                  placeholder="örn. akbir, Ankara, teknoloji, kitap…"
                  debouncedAutoSubmitMs={480}
                />
                <p className="discovery-search-field__hint muted discovery-search-field__hint--debounce">
                  Yazmayı bıraktığınızda arama kısa bir gecikmeyle otomatik yenilenir.
                </p>
              </div>

              <div className="discovery-search-field">
                <label className="discovery-search-field__label" htmlFor="brand-city-discover">
                  Şehir
                </label>
                <div className="influencer-search-form__city discovery-search-field__control--city">
                  <CitySelect
                    id="brand-city-discover"
                    name="city"
                    defaultValue={city}
                    required={false}
                    searchable
                  />
                </div>
              </div>

              <div className="discovery-search-field discovery-search-field--categories">
                <span className="discovery-search-field__label" id="influencer-disc-cat-label">
                  Kategori
                </span>
                <div className="discovery-search-field__control" aria-labelledby="influencer-disc-cat-label">
                  <CategoryMultiSelect
                    filterable
                    initialSelected={selectedCategoryKeys}
                    inputName="categories"
                  />
                </div>
              </div>

              <div className="discovery-search-field discovery-search-field--sort">
                <label className="discovery-search-field__label" htmlFor="discovery-sort-influencer-discover">
                  Sıralama
                </label>
                <select
                  id="discovery-sort-influencer-discover"
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
                <TrackedDiscoverSubmitButton location="influencer_discover" />
                <a className="btn secondary discovery-search-actions__reset" href="/influencer/discover">
                  Sıfırla
                </a>
              </div>
            </form>
          </div>

          {hasBrandSearch ? (
            <DiscoverActiveFilters
              basePath="/influencer/discover"
              q={q}
              city={city}
              categoryKeys={selectedCategoryKeys}
            />
          ) : null}

          {showExploreRail && exploreData && profile ? (
            <div id="influencer-discover-oneriler">
              <DiscoverExploreBrands
                data={exploreData}
                hrefBase="/influencer/discover"
                savedBrandUserIds={savedBrandUserIds}
                influencerBasePriceTRY={profile.basePriceTRY}
              />
            </div>
          ) : null}

          <div className="discovery-search-results">
            <h3 className="discovery-search-results__title">Sonuçlar</h3>
            {!hasBrandSearch ? (
              <EmptyStateCard
                icon={<EmptyGlyphBuildingOffice />}
                hint="Sonraki adım"
                title="Aramayı başlatın veya filtre seçin"
                description="Önerilen markalara tıklayın ya da şehir ve kategori seçip arama kutusuna birkaç kelime yazın."
              >
                {showExploreRail && exploreData && profile ? (
                  <a className="btn" href="#influencer-discover-oneriler">
                    Önerilenlere göz at
                  </a>
                ) : (
                  <a className="btn" href="#influencer-marka-ara">
                    Arama formuna git
                  </a>
                )}
              </EmptyStateCard>
            ) : brandResults.length === 0 ? (
              <EmptyStateCard
                icon={<EmptyGlyphMapPin />}
                hint="Kriterleri gevşetin"
                title="Sonuç bulunamadı"
                description="Bu kombinasyonda marka yok. Metni kısaltın veya filtreleri kaldırıp tekrar deneyin."
              >
                <a className="btn" href="/influencer/discover">
                  Filtreleri sıfırla
                </a>
              </EmptyStateCard>
            ) : (
              <div className="influencer-results-stack brand-results-stack">
                {brandResults.map((b) => {
                  const cats = b.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
                  const defaultAmt =
                    profile.basePriceTRY > 0
                      ? Math.max(100, Math.ceil(profile.basePriceTRY / 100) * 100)
                      : 100;
                  return (
                    <MarketplaceBrandOfferCard
                      key={b.id}
                      formIdKey={b.id}
                      brandUserId={b.userId}
                      companyName={b.companyName}
                      city={b.city}
                      profileImageUrl={b.profileImageUrl}
                      categoriesLine={cats}
                      whyLine={searchMatchWhy({
                        literal: b._matchScore,
                        fuzzy: b._fuzzyScore,
                        reason: b._matchReason,
                      })}
                      initialSaved={savedBrandUserIds.has(b.userId)}
                      defaultOfferAmountTRY={defaultAmt}
                      cardClassName="brand-result-card brand-result-card--hub"
                      profileLinkLabel="Profili incele"
                      submitButtonLabel="Markaya iş birliği isteği gönder"
                      briefRows={3}
                    />
                  );
                })}
              </div>
            )}
          </div>
        </section>
      ) : (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<EmptyGlyphBuildingOffice />}
            hint="Keşfet için profil"
            title="Önce influencer profilinizi tamamlayın"
            description="Marka araması ve teklif göndermek için profil bilgileriniz kayıtlı olmalı."
          >
            <Link className="btn" href="/influencer/profile?tab=genel">
              Profile git
            </Link>
          </EmptyStateCard>
        </section>
      )}

      <section className="dash-card dash-card--section">
        <h2 className="dash-section__title">Kayıtlı markalar</h2>
        {savedBrandCount === 0 ? (
          <EmptyStateCard
            icon={<Bookmark strokeWidth={1.25} />}
            hint="Teklif öncesi kısayol"
            title="Kayıtlı marka yok"
            description="İlginizi çeken markaları kart üzerinden kaydedin; teklif yazmadan önce buradan hızlıca açın."
          >
            <Link className="btn" href="/influencer/discover#influencer-marka-ara">
              Keşfede marka bul
            </Link>
          </EmptyStateCard>
        ) : (
          <div className="saved-teaser">
            <p className="muted saved-teaser__lede">
              <strong>{savedBrandCount}</strong> marka kayıtlı.
            </p>
            <Link className="btn secondary" href="/influencer/saved">
              Kayıtlıları görüntüle
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
