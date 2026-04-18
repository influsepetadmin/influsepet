import Link from "next/link";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";
import { getAvatarUrl } from "@/lib/avatar";
import { CATEGORY_KEYS, getCategoryLabel } from "@/lib/categories";
import { discoverCardWhy } from "@/lib/discovery/discoverCardWhy";
import type { DiscoverInfluencerSectionRow, DiscoverSection, SectionReason } from "@/lib/discovery/discoverSections";
import { truncateText } from "@/lib/dashboardProfileCompletion";
import { DiscoverySaveButton } from "./DiscoverySaveButton";

function InfluencerDiscoverCard({
  p,
  reason,
}: {
  p: DiscoverInfluencerSectionRow;
  reason: SectionReason;
}) {
  const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
  const defaultAmt = p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;

  return (
    <article className="influencer-result-card influencer-result-card--discover influencer-result-card--hub">
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
          <p className="muted influencer-result-card__why">{discoverCardWhy(reason)}</p>
        </div>
        <div className="influencer-result-card__actions">
          <DiscoverySaveButton />
          <Link className="btn secondary btn--sm" href={`/profil/influencer/${p.userId}`}>
            Profil
          </Link>
        </div>
      </div>
      <p className="muted influencer-result-card__meta influencer-result-card__stats">
        Takipçi: {p.followerCount.toLocaleString("tr-TR")} · Baz fiyat: {p.basePriceTRY} TRY
      </p>
      {p.nicheText?.trim() ? (
        <p className="muted influencer-result-card__niche">Niş: {truncateText(p.nicheText.trim(), 72)}</p>
      ) : null}

      <form className="influencer-result-card__form" action="/api/offers/create" method="post">
        <input type="hidden" name="influencerId" value={p.userId} />
        <label htmlFor={`hub-inf-title-${p.id}`}>Kampanya başlığı</label>
        <input id={`hub-inf-title-${p.id}`} name="title" type="text" required />
        <label htmlFor={`hub-inf-brief-${p.id}`}>Kısa açıklama</label>
        <textarea id={`hub-inf-brief-${p.id}`} name="brief" required rows={2} />
        <label htmlFor={`hub-inf-amt-${p.id}`}>İş birliği bütçesi (TRY)</label>
        <input
          id={`hub-inf-amt-${p.id}`}
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
}: {
  section: DiscoverSection<DiscoverInfluencerSectionRow>;
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
          <InfluencerDiscoverCard key={p.id} p={p} reason={section.reason} />
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
}: {
  sections: {
    forYou: DiscoverSection<DiscoverInfluencerSectionRow>;
    newest: DiscoverSection<DiscoverInfluencerSectionRow>;
    nearby: DiscoverSection<DiscoverInfluencerSectionRow>;
    featured: DiscoverSection<DiscoverInfluencerSectionRow>;
  };
  hrefBase: string;
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
            <SectionBlock key={section.key} section={section} />
          ))}
        </div>
      )}
    </div>
  );
}
