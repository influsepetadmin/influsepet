import Link from "next/link";
import { getAvatarUrl } from "@/lib/avatar";
import { DiscoverySaveButton } from "./DiscoverySaveButton";

export type MarketplaceBrandOfferCardProps = {
  /** Benzersiz form alanı id’leri (örn. brand profile id veya saved row id). */
  formIdKey: string;
  brandUserId: string;
  companyName: string;
  city: string | null;
  profileImageUrl: string | null;
  categoriesLine: string;
  whyLine: string;
  initialSaved: boolean;
  defaultOfferAmountTRY: number;
  cardClassName: string;
  profileLinkLabel: string;
  submitButtonLabel: string;
  briefRows: 2 | 3;
};

export function MarketplaceBrandOfferCard({
  formIdKey,
  brandUserId,
  companyName,
  city,
  profileImageUrl,
  categoriesLine,
  whyLine,
  initialSaved,
  defaultOfferAmountTRY,
  cardClassName,
  profileLinkLabel,
  submitButtonLabel,
  briefRows,
}: MarketplaceBrandOfferCardProps) {
  return (
    <article className={cardClassName}>
      <div className="brand-result-card__head brand-result-card__head--hub">
        <img
          className="brand-result-card__avatar"
          src={profileImageUrl ?? getAvatarUrl(brandUserId)}
          alt=""
        />
        <div className="brand-result-card__identity">
          <p className="brand-result-card__name">{companyName}</p>
          <p className="muted brand-result-card__city">{city ?? "—"}</p>
          {categoriesLine ? (
            <p className="muted brand-result-card__cats brand-result-card__meta-line">{categoriesLine}</p>
          ) : null}
          <p className="muted brand-result-card__why">{whyLine}</p>
        </div>
        <div className="brand-result-card__actions">
          <DiscoverySaveButton
            targetUserId={brandUserId}
            variant="influencer-saves-brand"
            initialSaved={initialSaved}
          />
          <Link className="btn secondary btn--sm" href={`/profil/marka/${brandUserId}`}>
            {profileLinkLabel}
          </Link>
        </div>
      </div>

      <form className="brand-result-card__form" action="/api/offers/create" method="post">
        <input type="hidden" name="brandId" value={brandUserId} />
        <label htmlFor={`brand-offer-title-${formIdKey}`}>Kampanya başlığı</label>
        <input id={`brand-offer-title-${formIdKey}`} name="title" type="text" required />
        <label htmlFor={`brand-offer-brief-${formIdKey}`}>Kısa açıklama</label>
        <textarea id={`brand-offer-brief-${formIdKey}`} name="brief" required rows={briefRows} />
        <label htmlFor={`brand-offer-amt-${formIdKey}`}>İş birliği bütçesi (TRY)</label>
        <input
          id={`brand-offer-amt-${formIdKey}`}
          name="offerAmountTRY"
          type="number"
          required
          min={100}
          step={100}
          defaultValue={defaultOfferAmountTRY}
        />
        <button className="btn" type="submit">
          {submitButtonLabel}
        </button>
      </form>
    </article>
  );
}
