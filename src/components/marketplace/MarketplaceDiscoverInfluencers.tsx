import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";
import { getAvatarUrl } from "@/lib/avatar";
import { getCategoryLabel } from "@/lib/categories";
import { truncateText } from "@/lib/dashboardProfileCompletion";

export type DiscoverInfluencerRow = {
  id: string;
  userId: string;
  username: string;
  profileImageUrl: string | null;
  city: string | null;
  followerCount: number;
  basePriceTRY: number;
  selectedCategories: { categoryKey: string }[];
  nicheText: string | null;
};

/**
 * Keşfet: arama yapmadan örnek içerik üreticileri (marka paneli).
 */
export function MarketplaceDiscoverInfluencers({ items }: { items: DiscoverInfluencerRow[] }) {
  return (
    <div className="marketplace-discover" id="marka-kesfet">
      <div className="marketplace-discover__intro">
        <h3 className="marketplace-discover__title">Keşfet</h3>
        <p className="marketplace-discover__lede muted">
          Arama yapmadan da bazı profillere göz atabilirsiniz. Daha akıllı öneriler yakında burada yer alacak.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyStateCard
          icon={<EmptyGlyphListBullet />}
          title="Keşfet listesi hazırlanıyor"
          description="Yeterli herkese açık profil olduğunda burada öne çıkan içerik üreticileri göreceksiniz."
        />
      ) : (
        <div className="marketplace-discover__grid">
          {items.map((p) => {
            const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
            const defaultAmt =
              p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;
            return (
              <article key={p.id} className="influencer-result-card influencer-result-card--discover">
                <div className="influencer-result-card__head">
                  <img
                    className="influencer-result-card__avatar"
                    src={p.profileImageUrl ?? getAvatarUrl(p.userId)}
                    alt=""
                  />
                  <div className="influencer-result-card__identity">
                    <p className="influencer-result-card__name">{p.username}</p>
                    <p className="muted influencer-result-card__city">{p.city ?? "—"}</p>
                  </div>
                  <a className="btn secondary btn--sm" href={`/profil/influencer/${p.userId}`}>
                    Profili incele
                  </a>
                </div>
                <p className="muted influencer-result-card__meta">
                  Takipçi: {p.followerCount.toLocaleString("tr-TR")} · Baz fiyat: {p.basePriceTRY} TRY
                </p>
                <p className="muted influencer-result-card__meta">
                  Kategoriler: {categories || "—"}
                </p>
                {p.nicheText?.trim() ? (
                  <p className="muted influencer-result-card__niche">
                    Niş: {truncateText(p.nicheText.trim(), 72)}
                  </p>
                ) : null}

                <form className="influencer-result-card__form" action="/api/offers/create" method="post">
                  <input type="hidden" name="influencerId" value={p.userId} />
                  <label htmlFor={`kesfet-inf-title-${p.id}`}>Kampanya başlığı</label>
                  <input id={`kesfet-inf-title-${p.id}`} name="title" type="text" required />
                  <label htmlFor={`kesfet-inf-brief-${p.id}`}>Kısa açıklama</label>
                  <textarea id={`kesfet-inf-brief-${p.id}`} name="brief" required rows={2} />
                  <label htmlFor={`kesfet-inf-amt-${p.id}`}>İş birliği bütçesi (TRY)</label>
                  <input
                    id={`kesfet-inf-amt-${p.id}`}
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
          })}
        </div>
      )}
    </div>
  );
}
