import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";
import { getAvatarUrl } from "@/lib/avatar";

export type DiscoverBrandRow = {
  id: string;
  userId: string;
  companyName: string;
  profileImageUrl: string | null;
  city: string | null;
};

type Props = {
  items: DiscoverBrandRow[];
  /** Influencer baz fiyatı — teklif formu varsayılanı */
  influencerBasePriceTRY: number;
};

/**
 * Keşfet: arama yapmadan örnek markalar (influencer paneli).
 */
export function MarketplaceDiscoverBrands({ items, influencerBasePriceTRY }: Props) {
  const defaultAmt =
    influencerBasePriceTRY > 0
      ? Math.max(100, Math.ceil(influencerBasePriceTRY / 100) * 100)
      : 100;

  return (
    <div className="marketplace-discover" id="influencer-kesfet">
      <div className="marketplace-discover__intro">
        <h3 className="marketplace-discover__title">Keşfet</h3>
        <p className="marketplace-discover__lede muted">
          Arama yapmadan da bazı markalara göz atabilirsiniz. Daha akıllı öneriler yakında burada yer alacak.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyStateCard
          icon={<EmptyGlyphListBullet />}
          title="Keşfet listesi hazırlanıyor"
          description="Yeterli kayıtlı marka olduğunda burada öne çıkan markaları göreceksiniz."
        />
      ) : (
        <div className="marketplace-discover__grid marketplace-discover__grid--brands">
          {items.map((b) => (
            <article key={b.id} className="brand-result-card brand-result-card--discover">
              <div className="brand-result-card__head">
                <img
                  className="brand-result-card__avatar"
                  src={b.profileImageUrl ?? getAvatarUrl(b.userId)}
                  alt=""
                />
                <div className="brand-result-card__identity">
                  <p className="brand-result-card__name">{b.companyName}</p>
                  <p className="muted brand-result-card__city">{b.city ?? "—"}</p>
                </div>
                <a className="btn secondary btn--sm" href={`/profil/marka/${b.userId}`}>
                  Profili incele
                </a>
              </div>

              <form className="brand-result-card__form" action="/api/offers/create" method="post">
                <input type="hidden" name="brandId" value={b.userId} />
                <label htmlFor={`kesfet-brand-title-${b.id}`}>Kampanya başlığı</label>
                <input id={`kesfet-brand-title-${b.id}`} name="title" type="text" required />
                <label htmlFor={`kesfet-brand-brief-${b.id}`}>Kısa açıklama</label>
                <textarea id={`kesfet-brand-brief-${b.id}`} name="brief" required rows={2} />
                <label htmlFor={`kesfet-brand-amt-${b.id}`}>İş birliği bütçesi (TRY)</label>
                <input
                  id={`kesfet-brand-amt-${b.id}`}
                  name="offerAmountTRY"
                  type="number"
                  required
                  min={100}
                  step={100}
                  defaultValue={defaultAmt}
                />
                <button className="btn" type="submit">
                  Markaya iş birliği isteği gönder
                </button>
              </form>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
