import Link from "next/link";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import CitySelect from "@/components/CitySelect";
import { DiscoverActiveFilters } from "@/components/marketplace/DiscoverActiveFilters";
import { DiscoverHubBrands } from "@/components/marketplace/DiscoverHubBrands";
import { DiscoverySearchQueryField } from "@/components/marketplace/DiscoverySearchQueryField";
import { MarketplaceBrandOfferCard } from "@/components/marketplace/MarketplaceBrandOfferCard";
import { getCategoryLabel } from "@/lib/categories";
import { searchMatchWhy } from "@/lib/discovery/discoverCardWhy";
import {
  loadBrandDiscoverSections,
  viewerCategoryKeysFromInfluencer,
} from "@/lib/discovery/discoverSections";
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

  const discoverPromise = profile
    ? loadBrandDiscoverSections(prisma, {
        city: profile.city,
        categoryKeys: viewerCategoryKeysFromInfluencer(profile),
      })
    : null;

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

  const [discoverSections, brandResults, savedBrandRows] = await Promise.all([
    discoverPromise ?? Promise.resolve(null),
    brandResultsPromise,
    savedBrandsPromise,
  ]);

  const savedBrandUserIds = new Set(savedBrandRows.map((r) => r.brandUserId));
  const savedBrandCount = savedBrandUserIds.size;

  return (
    <div className="dashboard-page influencer-panel-page influencer-discover">
      <header className="influencer-panel-page__hero">
        <h1 className="influencer-panel-page__title">Keşfet</h1>
        <p className="influencer-panel-page__lede muted">
          Marka arayın: kullanıcı adı, firma adı, şehir, kategori ve yazım toleranslı eşleşme. Keşfet
          bölümünde öneriler profilinize göre listelenir.
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
          </header>

          {discoverSections ? (
            <DiscoverHubBrands
              sections={discoverSections}
              influencerBasePriceTRY={profile.basePriceTRY}
              hrefBase="/influencer/discover"
              savedBrandUserIds={savedBrandUserIds}
            />
          ) : null}

          <div className="discovery-search-panel">
            <form className="influencer-search-form discovery-search-form" method="get" action="/influencer/discover">
              <div className="discovery-search-field discovery-search-field--query">
                <label className="discovery-search-field__label" htmlFor="discovery-query-influencer-discover">
                  İsim veya kullanıcı adı ara
                </label>
                <DiscoverySearchQueryField
                  id="discovery-query-influencer-discover"
                  defaultValue={q}
                  placeholder="ör. akbir, kırtasiye, elbistan, kitap…"
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
                <button className="btn discovery-search-actions__submit" type="submit">
                  Sonuçları göster
                </button>
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

          <div className="discovery-search-results">
            <h3 className="discovery-search-results__title">Sonuçlar</h3>
            {!hasBrandSearch ? (
              <EmptyStateCard
                icon={<EmptyGlyphBuildingOffice />}
                title="Aramayı başlatın veya filtre seçin"
                description="Şehir, kategori veya arama kutusu ile sonuçları daraltın. Üstteki Keşfet bölümünden önerilen markalara da göz atabilirsiniz."
              />
            ) : brandResults.length === 0 ? (
              <EmptyStateCard
                icon={<EmptyGlyphMapPin />}
                title="Sonuç bulunamadı"
                description="Bu kriterlere uygun marka bulunamadı. Yazımı kontrol edin, şehri veya kategorileri değiştirip yeniden deneyin veya sıfırlayın."
              />
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
                      whyLine={searchMatchWhy(b._matchScore)}
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
      ) : null}

      <section className="dash-card dash-card--section">
        <h2 className="dash-section__title">Kayıtlı markalar</h2>
        {savedBrandCount === 0 ? (
          <EmptyStateCard
            icon={<Bookmark strokeWidth={1.25} />}
            title="Listeniz boş"
            description="Keşfet veya arama sonuçlarında marka kartlarındaki “Kaydet” ile buraya ekleyin; teklif öncesi hızlıca dönün."
          >
            <Link className="btn" href="/influencer/discover">
              Keşfet
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
