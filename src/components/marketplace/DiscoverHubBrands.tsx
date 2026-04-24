import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ExploreFilterLink } from "@/components/marketplace/ExploreFilterLink";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";
import { CATEGORY_KEYS, getCategoryLabel } from "@/lib/categories";
import { discoverCardWhy } from "@/lib/discovery/discoverCardWhy";
import type { DiscoverBrandSectionRow, DiscoverSection, SectionReason } from "@/lib/discovery/discoverSections";
import { MarketplaceBrandOfferCard } from "./MarketplaceBrandOfferCard";

function BrandDiscoverCard({
  b,
  influencerBasePriceTRY,
  reason,
  initialSaved,
}: {
  b: DiscoverBrandSectionRow;
  influencerBasePriceTRY: number;
  reason: SectionReason;
  initialSaved: boolean;
}) {
  const defaultAmt =
    influencerBasePriceTRY > 0
      ? Math.max(100, Math.ceil(influencerBasePriceTRY / 100) * 100)
      : 100;
  const cats = b.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");

  return (
    <MarketplaceBrandOfferCard
      formIdKey={b.id}
      brandUserId={b.userId}
      companyName={b.companyName}
      city={b.city}
      profileImageUrl={b.profileImageUrl}
      categoriesLine={cats}
      whyLine={discoverCardWhy(reason)}
      initialSaved={initialSaved}
      defaultOfferAmountTRY={defaultAmt}
      cardClassName="brand-result-card brand-result-card--discover brand-result-card--hub"
      profileLinkLabel="Profil"
      submitButtonLabel="İş birliği isteği gönder"
      briefRows={2}
    />
  );
}

function SectionBlock({
  section,
  influencerBasePriceTRY,
  savedBrandUserIds,
}: {
  section: DiscoverSection<DiscoverBrandSectionRow>;
  influencerBasePriceTRY: number;
  savedBrandUserIds: Set<string>;
}) {
  if (section.items.length === 0) return null;
  return (
    <section className="discover-hub__section" aria-labelledby={`hub-brand-${section.key}`}>
      <div className="discover-hub__section-head">
        <h3 className="discover-hub__section-title" id={`hub-brand-${section.key}`}>
          {section.title}
        </h3>
        <p className="discover-hub__section-sub muted">{section.subtitle}</p>
      </div>
      <div className="marketplace-discover__grid marketplace-discover__grid--brands discover-hub__grid">
        {section.items.map((b) => (
          <BrandDiscoverCard
            key={b.id}
            b={b}
            influencerBasePriceTRY={influencerBasePriceTRY}
            reason={section.reason}
            initialSaved={savedBrandUserIds.has(b.userId)}
          />
        ))}
      </div>
    </section>
  );
}

export function PopularCategoriesChips({ hrefBase }: { hrefBase: string }) {
  const keys = CATEGORY_KEYS.slice(0, 12);
  return (
    <div className="discover-popular-cats">
      <h3 className="discover-popular-cats__title">Popüler kategoriler</h3>
      <p className="discover-popular-cats__lede muted">Hızlı filtre — arama formuyla birleştirebilirsiniz.</p>
      <div className="discover-popular-cats__chips">
        {keys.map((key) => (
          <ExploreFilterLink
            key={key}
            className="discover-chip"
            href={`${hrefBase}?categories=${encodeURIComponent(key)}`}
            filterKind="category"
            value={key}
          >
            {getCategoryLabel(key)}
          </ExploreFilterLink>
        ))}
      </div>
    </div>
  );
}

export function DiscoverHubBrands({
  sections,
  influencerBasePriceTRY,
  hrefBase,
  savedBrandUserIds,
}: {
  sections: {
    forYou: DiscoverSection<DiscoverBrandSectionRow>;
    newest: DiscoverSection<DiscoverBrandSectionRow>;
    nearby: DiscoverSection<DiscoverBrandSectionRow>;
    featured: DiscoverSection<DiscoverBrandSectionRow>;
  };
  influencerBasePriceTRY: number;
  hrefBase: string;
  savedBrandUserIds: Set<string>;
}) {
  const list = [sections.forYou, sections.newest, sections.nearby, sections.featured];
  const anyItems = list.some((s) => s.items.length > 0);

  return (
    <div className="discover-hub" id="influencer-kesfet">
      <div className="marketplace-discover__intro discover-hub__intro">
        <h3 className="marketplace-discover__title">Keşfet</h3>
        <p className="marketplace-discover__lede muted">
          Önerilen bölümler profilinize göre şekillenir; arama ile daha daraltabilirsiniz.
        </p>
      </div>

      <PopularCategoriesChips hrefBase={hrefBase} />

      {!anyItems ? (
        <EmptyStateCard
          icon={<EmptyGlyphListBullet />}
          title="Keşfet listesi hazırlanıyor"
          description="Yeterli kayıtlı marka olduğunda burada öneriler görünecek."
        />
      ) : (
        <div className="discover-hub__sections">
          {list.map((section) => (
            <SectionBlock
              key={section.key}
              section={section}
              influencerBasePriceTRY={influencerBasePriceTRY}
              savedBrandUserIds={savedBrandUserIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
