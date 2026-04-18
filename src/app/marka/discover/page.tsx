import Link from "next/link";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import CitySelect from "@/components/CitySelect";
import { DiscoverActiveFilters } from "@/components/marketplace/DiscoverActiveFilters";
import { DiscoverHubInfluencers } from "@/components/marketplace/DiscoverHubInfluencers";
import { DiscoverySaveButton } from "@/components/marketplace/DiscoverySaveButton";
import { DiscoverySearchQueryField } from "@/components/marketplace/DiscoverySearchQueryField";
import { getAvatarUrl } from "@/lib/avatar";
import { getCategoryLabel } from "@/lib/categories";
import { searchMatchWhy } from "@/lib/discovery/discoverCardWhy";
import {
  loadInfluencerDiscoverSections,
  viewerCategoryKeysFromBrand,
} from "@/lib/discovery/discoverSections";
import { runInfluencerMarketplaceSearch } from "@/lib/discovery/marketplaceSearchRun";
import { truncateText } from "@/lib/dashboardProfileCompletion";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";
import { parseMarketplaceSearchQuery } from "@/lib/marketplaceTextSearch";
import { prisma } from "@/lib/prisma";
import {
  EmptyGlyphListBullet,
  EmptyGlyphMagnifyingGlass,
  EmptyGlyphMapPin,
} from "@/components/icons/emptyStateGlyphs";

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

  const discoverPromise = canUseMarketplace && profile
    ? loadInfluencerDiscoverSections(prisma, {
        city: profile.city,
        categoryKeys: viewerCategoryKeysFromBrand(profile),
      })
    : null;

  const influencerResultsPromise =
    canUseMarketplace && hasActiveSearch
      ? runInfluencerMarketplaceSearch(prisma, {
          city: city.trim(),
          selectedCategoryKeys,
          q,
          take: 30,
        })
      : Promise.resolve([]);

  const [discoverSections, influencerResults] = await Promise.all([
    discoverPromise ?? Promise.resolve(null),
    influencerResultsPromise,
  ]);

  return (
    <div className="dashboard-page influencer-panel-page marka-discover">
      <header className="influencer-panel-page__hero">
        <h1 className="influencer-panel-page__title">Keşfet</h1>
        <p className="influencer-panel-page__lede muted">
          İçerik üreticisi arayın: kullanıcı adı, görünen ad, şehir, kategori, niş ve yazım toleranslı
          eşleşme. Keşfet bölümü profilinize göre öneriler sunar.
        </p>
      </header>

      {!canUseMarketplace ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<EmptyGlyphMagnifyingGlass />}
            title="Önce marka profilinizi tamamlayın"
            description="Keşfet ve teklif oluşturma için şirket profilinizin kayıtlı olması gerekir."
          >
            <Link className="btn" href="/marka/profile?tab=genel">
              Profile git
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
              Şehir, kategori veya metin ile daraltın; yakın yazımlar ve kısmi eşleşmeler desteklenir.
            </p>
          </header>

          {discoverSections ? <DiscoverHubInfluencers sections={discoverSections} hrefBase="/marka/discover" /> : null}

          <div className="discovery-search-panel">
            <form className="influencer-search-form discovery-search-form" method="get" action="/marka/discover">
              <div className="discovery-search-field discovery-search-field--query">
                <label className="discovery-search-field__label" htmlFor="discovery-query-marka-discover">
                  İsim veya kullanıcı adı ara
                </label>
                <DiscoverySearchQueryField
                  id="discovery-query-marka-discover"
                  defaultValue={q}
                  placeholder="ör. zeynepbastık, niş, şehir…"
                  debouncedAutoSubmitMs={480}
                />
                <p className="discovery-search-field__hint muted discovery-search-field__hint--debounce">
                  Yazmayı bıraktığınızda arama kısa bir gecikmeyle otomatik yenilenir.
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
                  Önerilen ve alfabetik sıralama üzerinde çalışıyoruz.
                </p>
              </div>

              <div className="influencer-search-form__actions discovery-search-actions">
                <button className="btn discovery-search-actions__submit" type="submit">
                  Sonuçları göster
                </button>
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

          <div className="discovery-search-results">
            <h3 className="discovery-search-results__title">Sonuçlar</h3>
            {!hasActiveSearch ? (
              <EmptyStateCard
                icon={<EmptyGlyphMagnifyingGlass />}
                title="Aramayı başlatın veya filtre seçin"
                description="Şehir, kategori veya arama kutusu ile sonuçları daraltın. Üstteki Keşfet bölümünden önerilen profillere de göz atabilirsiniz."
              />
            ) : influencerResults.length === 0 ? (
              <EmptyStateCard
                icon={<EmptyGlyphMapPin />}
                title="Sonuç bulunamadı"
                description="Bu filtrelere uygun içerik üreticisi bulunamadı. Arama metnini, kategori veya şehir seçimini değiştirip yeniden deneyin veya sıfırlayın."
              />
            ) : (
              <div className="influencer-results-stack">
                {influencerResults.map((p) => {
                  const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
                  return (
                    <article key={p.id} className="influencer-result-card influencer-result-card--hub">
                      <div className="influencer-result-card__head influencer-result-card__head--hub">
                        <img
                          className="influencer-result-card__avatar"
                          src={p.profileImageUrl ?? getAvatarUrl(p.userId)}
                          alt=""
                        />
                        <div className="influencer-result-card__identity">
                          <p className="influencer-result-card__name">{p.username}</p>
                          <p className="muted influencer-result-card__city">{p.city ?? "—"}</p>
                          <p className="muted influencer-result-card__meta">{categories || "—"}</p>
                          <p className="muted influencer-result-card__why">{searchMatchWhy(p._matchScore)}</p>
                        </div>
                        <div className="influencer-result-card__actions">
                          <DiscoverySaveButton />
                          <Link className="btn secondary btn--sm" href={`/profil/influencer/${p.userId}`}>
                            Profili incele
                          </Link>
                        </div>
                      </div>
                      <p className="muted influencer-result-card__meta influencer-result-card__stats">
                        Takipçi: {p.followerCount.toLocaleString("tr-TR")} · Baz fiyat: {p.basePriceTRY} TRY
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

      <section className="dash-card dash-card--section">
        <h2 className="dash-section__title">Kayıtlı / favori influencerlar</h2>
        <EmptyStateCard
          icon={<EmptyGlyphListBullet />}
          title="Yakında"
          description="Beğendiğiniz içerik üreticilerini buraya kaydetme özelliği üzerinde çalışıyoruz."
        >
          <Link className="btn secondary" href="/marka/discover">
            Keşfet’e dön
          </Link>
        </EmptyStateCard>
      </section>
    </div>
  );
}
