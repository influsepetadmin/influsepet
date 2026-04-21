import Link from "next/link";
import { getAvatarUrl } from "@/lib/avatar";
import { truncateText } from "@/lib/dashboardProfileCompletion";
import { DiscoverySaveButton } from "./DiscoverySaveButton";

export type MarketplaceInfluencerOfferCardProps = {
  formIdKey: string;
  influencerUserId: string;
  username: string;
  city: string | null;
  profileImageUrl: string | null;
  categoriesLine: string;
  whyLine: string;
  followerCount: number;
  basePriceTRY: number;
  nicheText: string | null;
  nicheTruncateLen: number;
  initialSaved: boolean;
  defaultOfferAmountTRY: number;
  cardClassName: string;
  profileLinkLabel: string;
  submitButtonLabel: string;
  briefRows: 2 | 3;
};

export function MarketplaceInfluencerOfferCard({
  formIdKey,
  influencerUserId,
  username,
  city,
  profileImageUrl,
  categoriesLine,
  whyLine,
  followerCount,
  basePriceTRY,
  nicheText,
  nicheTruncateLen,
  initialSaved,
  defaultOfferAmountTRY,
  cardClassName,
  profileLinkLabel,
  submitButtonLabel,
  briefRows,
}: MarketplaceInfluencerOfferCardProps) {
  const nicheTrimmed = nicheText?.trim() ?? "";

  return (
    <article className={cardClassName}>
      <div className="influencer-result-card__head influencer-result-card__head--hub">
        <img
          className="influencer-result-card__avatar"
          src={profileImageUrl ?? getAvatarUrl(influencerUserId)}
          alt=""
        />
        <div className="influencer-result-card__identity">
          <p className="influencer-result-card__name">{username}</p>
          <p className="muted influencer-result-card__city">{city ?? "—"}</p>
          <p className="muted influencer-result-card__meta">{categoriesLine || "—"}</p>
          <p className="muted influencer-result-card__why">{whyLine}</p>
        </div>
        <div className="influencer-result-card__actions">
          <DiscoverySaveButton
            targetUserId={influencerUserId}
            variant="brand-saves-influencer"
            initialSaved={initialSaved}
          />
          <Link className="btn secondary btn--sm" href={`/profil/influencer/${influencerUserId}`}>
            {profileLinkLabel}
          </Link>
        </div>
      </div>
      <p className="muted influencer-result-card__meta influencer-result-card__stats">
        Takipçi: {followerCount.toLocaleString("tr-TR")} · Baz fiyat: {basePriceTRY} TRY
      </p>
      {nicheTrimmed ? (
        <p className="muted influencer-result-card__niche">
          Niş: {truncateText(nicheTrimmed, nicheTruncateLen)}
        </p>
      ) : null}

      <form className="influencer-result-card__form" action="/api/offers/create" method="post">
        <input type="hidden" name="influencerId" value={influencerUserId} />
        <label htmlFor={`inf-offer-title-${formIdKey}`}>Kampanya başlığı</label>
        <input id={`inf-offer-title-${formIdKey}`} name="title" type="text" required />
        <label htmlFor={`inf-offer-brief-${formIdKey}`}>Kısa açıklama</label>
        <textarea id={`inf-offer-brief-${formIdKey}`} name="brief" required rows={briefRows} />
        <label htmlFor={`inf-offer-amt-${formIdKey}`}>İş birliği bütçesi (TRY)</label>
        <input
          id={`inf-offer-amt-${formIdKey}`}
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
