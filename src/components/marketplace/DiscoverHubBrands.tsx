import Link from "next/link";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";
import { getAvatarUrl } from "@/lib/avatar";
import { CATEGORY_KEYS, getCategoryLabel } from "@/lib/categories";
import { discoverCardWhy } from "@/lib/discovery/discoverCardWhy";
import type { DiscoverBrandSectionRow, DiscoverSection, SectionReason } from "@/lib/discovery/discoverSections";
import { DiscoverySaveButton } from "./DiscoverySaveButton";

function BrandDiscoverCard({
  b,
  influencerBasePriceTRY,
  reason,
}: {
  b: DiscoverBrandSectionRow;
  influencerBasePriceTRY: number;
  reason: SectionReason;
}) {
  const defaultAmt =
    influencerBasePriceTRY > 0
      ? Math.max(100, Math.ceil(influencerBasePriceTRY / 100) * 100)
      : 100;
  const cats = b.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");

  return (
    <article className="brand-result-card brand-result-card--discover brand-result-card--hub">
      <div className="brand-result-card__head brand-result-card__head--hub">
        <img
          className="brand-result-card__avatar"
          src={b.profileImageUrl ?? getAvatarUrl(b.userId)}
          alt=""
        />
        <div className="brand-result-card__identity">
          <p className="brand-result-card__name">{b.companyName}</p>
          <p className="muted brand-result-card__city">{b.city ?? "—"}</p>
          {cats ? (
            <p className="muted brand-result-card__cats brand-result-card__meta-line">{cats}</p>
          ) : null}
          <p className="muted brand-result-card__why">{discoverCardWhy(reason)}</p>
        </div>
        <div className="brand-result-card__actions">
          <DiscoverySaveButton />
          <Link className="btn secondary btn--sm" href={`/profil/marka/${b.userId}`}>
            Profil
          </Link>
        </div>
      </div>

      <form className="brand-result-card__form" action="/api/offers/create" method="post">
        <input type="hidden" name="brandId" value={b.userId} />
        <label htmlFor={`hub-brand-title-${b.id}`}>Kampanya başlığı</label>
        <input id={`hub-brand-title-${b.id}`} name="title" type="text" required />
        <label htmlFor={`hub-brand-brief-${b.id}`}>Kısa açıklama</label>
        <textarea id={`hub-brand-brief-${b.id}`} name="brief" required rows={2} />
        <label htmlFor={`hub-brand-amt-${b.id}`}>İş birliği bütçesi (TRY)</label>
        <input
          id={`hub-brand-amt-${b.id}`}
          name="offerAmountTRY"
          type="number"
          required
          min={100}
          step={100}
          defaultValue={defaultAmt}
        />
        <button className="btn" type="submit">
          İş birliği isteği gönder
        </button>
      </form>
    </article>
  );
}

function SectionBlock({
  section,
  influencerBasePriceTRY,
}: {
  section: DiscoverSection<DiscoverBrandSectionRow>;
  influencerBasePriceTRY: number;
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
          <Link key={key} className="discover-chip" href={`${hrefBase}?categories=${encodeURIComponent(key)}`}>
            {getCategoryLabel(key)}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function DiscoverHubBrands({
  sections,
  influencerBasePriceTRY,
  hrefBase,
}: {
  sections: {
    forYou: DiscoverSection<DiscoverBrandSectionRow>;
    newest: DiscoverSection<DiscoverBrandSectionRow>;
    nearby: DiscoverSection<DiscoverBrandSectionRow>;
    featured: DiscoverSection<DiscoverBrandSectionRow>;
  };
  influencerBasePriceTRY: number;
  hrefBase: string;
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
            <SectionBlock key={section.key} section={section} influencerBasePriceTRY={influencerBasePriceTRY} />
          ))}
        </div>
      )}
    </div>
  );
}
