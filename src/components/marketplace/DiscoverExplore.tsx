import Link from "next/link";
import { getCategoryLabel } from "@/lib/categories";
import type {
  DiscoverBrandSectionRow,
  DiscoverInfluencerSectionRow,
  ExploreCategoryCount,
  ExploreCityCount,
} from "@/lib/discovery/discoverSections";
import { MarketplaceBrandOfferCard } from "./MarketplaceBrandOfferCard";
import { MarketplaceInfluencerOfferCard } from "./MarketplaceInfluencerOfferCard";

function ExploreEyebrow() {
  return (
    <div className="discover-explore__eyebrow">
      <span className="discover-explore__eyebrow-k">Öne çıkanlar</span>
      <span className="discover-explore__eyebrow-t muted">Arama yapmadan hızlı başlangıç — tıklayınca filtre uygulanır.</span>
    </div>
  );
}

function ExploreBlock({
  labelledBy,
  title,
  subtitle,
  children,
}: {
  labelledBy: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="discover-explore__block" aria-labelledby={labelledBy}>
      <div className="discover-explore__block-head">
        <p className="discover-explore__block-title" id={labelledBy}>
          {title}
        </p>
        <p className="discover-explore__block-sub muted">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function ExplorePills({ children }: { children: React.ReactNode }) {
  return (
    <div className="discover-explore__pills" role="list">
      {children}
    </div>
  );
}

function ExploreRail({ children }: { children: React.ReactNode }) {
  return (
    <div className="discover-explore__rail">
      <div className="discover-explore__rail-track">{children}</div>
    </div>
  );
}

export function DiscoverExploreInfluencers({
  data,
  hrefBase,
  savedInfluencerUserIds,
}: {
  data: {
    popularCategories: ExploreCategoryCount[];
    trendingCities: ExploreCityCount[];
    suggested: DiscoverInfluencerSectionRow[];
    newest: DiscoverInfluencerSectionRow[];
  };
  hrefBase: string;
  savedInfluencerUserIds: Set<string>;
}) {
  const { popularCategories, trendingCities, suggested, newest } = data;
  const hasAny =
    popularCategories.length > 0 ||
    trendingCities.length > 0 ||
    suggested.length > 0 ||
    newest.length > 0;
  if (!hasAny) return null;

  return (
    <section className="discover-explore" aria-label="Keşfet — öneriler">
      <ExploreEyebrow />
      {popularCategories.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-inf-pop-cat"
          title="Popüler kategoriler"
          subtitle="Platformda en çok seçilen içerik kategorileri."
        >
          <ExplorePills>
            {popularCategories.map(({ key, count }) => (
              <Link
                key={key}
                role="listitem"
                className="discover-chip discover-explore__pill"
                href={`${hrefBase}?categories=${encodeURIComponent(key)}`}
              >
                <span>{getCategoryLabel(key)}</span>
                <span className="discover-explore__pill-n" aria-hidden="true">
                  {count}
                </span>
              </Link>
            ))}
          </ExplorePills>
        </ExploreBlock>
      ) : null}

      {trendingCities.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-inf-cities"
          title="Öne çıkan şehirler"
          subtitle="Profillerde en sık görülen şehirler."
        >
          <ExplorePills>
            {trendingCities.map(({ city, count }) => (
              <Link
                key={city}
                role="listitem"
                className="discover-chip discover-explore__pill"
                href={`${hrefBase}?city=${encodeURIComponent(city)}`}
              >
                <span>{city}</span>
                <span className="discover-explore__pill-n" aria-hidden="true">
                  {count}
                </span>
              </Link>
            ))}
          </ExplorePills>
        </ExploreBlock>
      ) : null}

      {suggested.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-inf-suggested"
          title="Önerilen içerik üreticileri"
          subtitle="Takipçi sayısı ve güncellik ile öne çıkan profiller."
        >
          <ExploreRail>
            {suggested.map((p) => {
              const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
              const defaultAmt =
                p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;
              return (
                <MarketplaceInfluencerOfferCard
                  key={p.id}
                  exploreRail
                  formIdKey={`explore-sug-${p.id}`}
                  influencerUserId={p.userId}
                  username={p.username}
                  city={p.city}
                  profileImageUrl={p.profileImageUrl}
                  categoriesLine={categories}
                  whyLine="Yüksek takipçi ve güncel profil sinyali."
                  followerCount={p.followerCount}
                  basePriceTRY={p.basePriceTRY}
                  nicheText={p.nicheText}
                  nicheTruncateLen={56}
                  initialSaved={savedInfluencerUserIds.has(p.userId)}
                  defaultOfferAmountTRY={defaultAmt}
                  cardClassName="influencer-result-card influencer-result-card--hub influencer-result-card--explore-rail"
                  profileLinkLabel="Profil"
                  submitButtonLabel="İş birliği isteği gönder"
                  briefRows={2}
                />
              );
            })}
          </ExploreRail>
        </ExploreBlock>
      ) : null}

      {newest.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-inf-newest"
          title="Yeni profiller"
          subtitle="Yakın zamanda oluşturulan kayıtlar (önerilerle çakışanlar hariç)."
        >
          <ExploreRail>
            {newest.map((p) => {
              const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
              const defaultAmt =
                p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;
              return (
                <MarketplaceInfluencerOfferCard
                  key={p.id}
                  exploreRail
                  formIdKey={`explore-new-${p.id}`}
                  influencerUserId={p.userId}
                  username={p.username}
                  city={p.city}
                  profileImageUrl={p.profileImageUrl}
                  categoriesLine={categories}
                  whyLine="Yeni kayıtlı profil."
                  followerCount={p.followerCount}
                  basePriceTRY={p.basePriceTRY}
                  nicheText={p.nicheText}
                  nicheTruncateLen={56}
                  initialSaved={savedInfluencerUserIds.has(p.userId)}
                  defaultOfferAmountTRY={defaultAmt}
                  cardClassName="influencer-result-card influencer-result-card--hub influencer-result-card--explore-rail"
                  profileLinkLabel="Profil"
                  submitButtonLabel="İş birliği isteği gönder"
                  briefRows={2}
                />
              );
            })}
          </ExploreRail>
        </ExploreBlock>
      ) : null}
    </section>
  );
}

export function DiscoverExploreBrands({
  data,
  hrefBase,
  savedBrandUserIds,
  influencerBasePriceTRY,
}: {
  data: {
    popularSectors: ExploreCategoryCount[];
    activeCities: ExploreCityCount[];
    featured: DiscoverBrandSectionRow[];
    newest: DiscoverBrandSectionRow[];
  };
  hrefBase: string;
  savedBrandUserIds: Set<string>;
  influencerBasePriceTRY: number;
}) {
  const { popularSectors, activeCities, featured, newest } = data;
  const defaultAmt =
    influencerBasePriceTRY > 0
      ? Math.max(100, Math.ceil(influencerBasePriceTRY / 100) * 100)
      : 100;

  const hasAny =
    popularSectors.length > 0 || activeCities.length > 0 || featured.length > 0 || newest.length > 0;
  if (!hasAny) return null;

  return (
    <section className="discover-explore" aria-label="Keşfet — marka önerileri">
      <ExploreEyebrow />
      {popularSectors.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-br-sectors"
          title="Popüler sektörler"
          subtitle="Marka profillerinde en çok seçilen kategoriler."
        >
          <ExplorePills>
            {popularSectors.map(({ key, count }) => (
              <Link
                key={key}
                role="listitem"
                className="discover-chip discover-explore__pill"
                href={`${hrefBase}?categories=${encodeURIComponent(key)}`}
              >
                <span>{getCategoryLabel(key)}</span>
                <span className="discover-explore__pill-n" aria-hidden="true">
                  {count}
                </span>
              </Link>
            ))}
          </ExplorePills>
        </ExploreBlock>
      ) : null}

      {activeCities.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-br-cities"
          title="Aktif şehirler"
          subtitle="Marka profillerinde en sık görülen şehirler."
        >
          <ExplorePills>
            {activeCities.map(({ city, count }) => (
              <Link
                key={city}
                role="listitem"
                className="discover-chip discover-explore__pill"
                href={`${hrefBase}?city=${encodeURIComponent(city)}`}
              >
                <span>{city}</span>
                <span className="discover-explore__pill-n" aria-hidden="true">
                  {count}
                </span>
              </Link>
            ))}
          </ExplorePills>
        </ExploreBlock>
      ) : null}

      {featured.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-br-featured"
          title="Öne çıkan markalar"
          subtitle="Görseli tamamlanmış ve yakın zamanda güncellenen markalar."
        >
          <ExploreRail>
            {featured.map((b) => {
              const cats = b.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
              return (
                <MarketplaceBrandOfferCard
                  key={b.id}
                  exploreRail
                  formIdKey={`explore-feat-${b.id}`}
                  brandUserId={b.userId}
                  companyName={b.companyName}
                  city={b.city}
                  profileImageUrl={b.profileImageUrl}
                  categoriesLine={cats}
                  whyLine="Güncel ve görünür marka profili."
                  initialSaved={savedBrandUserIds.has(b.userId)}
                  defaultOfferAmountTRY={defaultAmt}
                  cardClassName="brand-result-card brand-result-card--hub brand-result-card--explore-rail"
                  profileLinkLabel="Profil"
                  submitButtonLabel="Markaya iş birliği isteği gönder"
                  briefRows={2}
                />
              );
            })}
          </ExploreRail>
        </ExploreBlock>
      ) : null}

      {newest.length > 0 ? (
        <ExploreBlock
          labelledBy="explore-br-newest"
          title="Yeni katılan markalar"
          subtitle="Yakın zamanda kayıt olan markalar (öne çıkanlarla çakışanlar hariç)."
        >
          <ExploreRail>
            {newest.map((b) => {
              const cats = b.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
              return (
                <MarketplaceBrandOfferCard
                  key={b.id}
                  exploreRail
                  formIdKey={`explore-new-br-${b.id}`}
                  brandUserId={b.userId}
                  companyName={b.companyName}
                  city={b.city}
                  profileImageUrl={b.profileImageUrl}
                  categoriesLine={cats}
                  whyLine="Yeni kayıtlı marka."
                  initialSaved={savedBrandUserIds.has(b.userId)}
                  defaultOfferAmountTRY={defaultAmt}
                  cardClassName="brand-result-card brand-result-card--hub brand-result-card--explore-rail"
                  profileLinkLabel="Profil"
                  submitButtonLabel="Markaya iş birliği isteği gönder"
                  briefRows={2}
                />
              );
            })}
          </ExploreRail>
        </ExploreBlock>
      ) : null}
    </section>
  );
}
