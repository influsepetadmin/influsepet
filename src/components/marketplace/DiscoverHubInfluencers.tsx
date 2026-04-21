import Link from "next/link";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";
import { CATEGORY_KEYS, getCategoryLabel } from "@/lib/categories";
import { discoverCardWhy } from "@/lib/discovery/discoverCardWhy";
import type { DiscoverInfluencerSectionRow, DiscoverSection, SectionReason } from "@/lib/discovery/discoverSections";
import { MarketplaceInfluencerOfferCard } from "./MarketplaceInfluencerOfferCard";

function InfluencerDiscoverCard({
  p,
  reason,
  initialSaved,
}: {
  p: DiscoverInfluencerSectionRow;
  reason: SectionReason;
  initialSaved: boolean;
}) {
  const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
  const defaultAmt = p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;

  return (
    <MarketplaceInfluencerOfferCard
      formIdKey={p.id}
      influencerUserId={p.userId}
      username={p.username}
      city={p.city}
      profileImageUrl={p.profileImageUrl}
      categoriesLine={categories}
      whyLine={discoverCardWhy(reason)}
      followerCount={p.followerCount}
      basePriceTRY={p.basePriceTRY}
      nicheText={p.nicheText}
      nicheTruncateLen={72}
      initialSaved={initialSaved}
      defaultOfferAmountTRY={defaultAmt}
      cardClassName="influencer-result-card influencer-result-card--discover influencer-result-card--hub"
      profileLinkLabel="Profil"
      submitButtonLabel="İş birliği isteği gönder"
      briefRows={2}
    />
  );
}

function SectionBlock({
  section,
  savedInfluencerUserIds,
}: {
  section: DiscoverSection<DiscoverInfluencerSectionRow>;
  savedInfluencerUserIds: Set<string>;
}) {
  if (section.items.length === 0) return null;
  return (
    <section className="discover-hub__section" aria-labelledby={`hub-inf-${section.key}`}>
      <div className="discover-hub__section-head">
        <h3 className="discover-hub__section-title" id={`hub-inf-${section.key}`}>
          {section.title}
        </h3>
        <p className="discover-hub__section-sub muted">{section.subtitle}</p>
      </div>
      <div className="marketplace-discover__grid discover-hub__grid">
        {section.items.map((p) => (
          <InfluencerDiscoverCard
            key={p.id}
            p={p}
            reason={section.reason}
            initialSaved={savedInfluencerUserIds.has(p.userId)}
          />
        ))}
      </div>
    </section>
  );
}

export function PopularCategoriesChipsMarka({ hrefBase }: { hrefBase: string }) {
  const keys = CATEGORY_KEYS.slice(0, 12);
  return (
    <div className="discover-popular-cats">
      <h3 className="discover-popular-cats__title">Popüler kategoriler</h3>
      <p className="discover-popular-cats__lede muted">Birden fazla kategori seçerek daraltabilirsiniz.</p>
      <div className="discover-popular-cats__chips">
        {keys.map((key) => (
          <Link key={key} className="discover-chip" href={`${hrefBase}?categories=${encodeURIComponent(key)}`}>
            {getCategoryLabel(key)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DiscoverHubInfluencers({
  sections,
  hrefBase,
  savedInfluencerUserIds,
}: {
  sections: {
    forYou: DiscoverSection<DiscoverInfluencerSectionRow>;
    newest: DiscoverSection<DiscoverInfluencerSectionRow>;
    nearby: DiscoverSection<DiscoverInfluencerSectionRow>;
    featured: DiscoverSection<DiscoverInfluencerSectionRow>;
  };
  hrefBase: string;
  savedInfluencerUserIds: Set<string>;
}) {
  const list = [sections.forYou, sections.newest, sections.nearby, sections.featured];
  const anyItems = list.some((s) => s.items.length > 0);

  return (
    <div className="discover-hub" id="marka-kesfet">
      <div className="marketplace-discover__intro discover-hub__intro">
        <h3 className="marketplace-discover__title">Keşfet</h3>
        <p className="marketplace-discover__lede muted">
          Kategori ve konuma göre öneriler; arama ile hedefinizi netleştirin.
        </p>
      </div>

      <PopularCategoriesChipsMarka hrefBase={hrefBase} />

      {!anyItems ? (
        <EmptyStateCard
          icon={<EmptyGlyphListBullet />}
          title="Keşfet listesi hazırlanıyor"
          description="Yeterli profil olduğunda burada öneriler görünecek."
        />
      ) : (
        <div className="discover-hub__sections">
          {list.map((section) => (
            <SectionBlock key={section.key} section={section} savedInfluencerUserIds={savedInfluencerUserIds} />
          ))}
        </div>
      )}
    </div>
  );
}
