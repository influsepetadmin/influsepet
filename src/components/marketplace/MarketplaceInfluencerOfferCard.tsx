"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { trackFirstTimeOnce, trackProductEvent } from "@/lib/productTracking/productEvents";
import { getProfileImageOrAvatarUrl } from "@/lib/avatar";
import { truncateText } from "@/lib/dashboardProfileCompletion";
import { DiscoverProfileFromDiscoverLink } from "@/components/marketplace/DiscoverProfileFromDiscoverLink";
import { DiscoverySaveButton } from "./DiscoverySaveButton";
import { TrackedOfferCreateForm } from "@/components/marketplace/TrackedOfferCreateForm";

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
  /** Compact rail: hide offer form (e.g. Discover Explore rows). */
  exploreRail?: boolean;
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
  exploreRail = false,
}: MarketplaceInfluencerOfferCardProps) {
  const nicheTrimmed = nicheText?.trim() ?? "";
  const [offerFormOpen, setOfferFormOpen] = useState(false);
  const router = useRouter();
  const profileHref = `/profil/influencer/${influencerUserId}?from=discover`;
  const formPanelId = `inf-offer-form-panel-${formIdKey}`;

  function onCardClick(e: MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("a,button,input,textarea,select,label,[role='button']")) return;
    trackProductEvent({
      event: "profile_cta_click",
      location: "discover",
      label: "profile_influencer",
      targetUserId: influencerUserId,
    });
    trackFirstTimeOnce("influsepet_ft_profile_from_discover_influencer", {
      event: "first_profile_visit_from_discover",
      location: "discover",
      label: "profile_influencer",
      targetUserId: influencerUserId,
    });
    router.push(profileHref);
  }

  return (
    <article className={`${cardClassName} discover-card-clickable`} onClick={onCardClick}>
      <div className="influencer-result-card__head influencer-result-card__head--hub">
        <img
          className="influencer-result-card__avatar"
          src={getProfileImageOrAvatarUrl(profileImageUrl, influencerUserId)}
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
          <DiscoverProfileFromDiscoverLink
            className="btn secondary btn--sm"
            href={profileHref}
            profileRole="influencer"
            targetUserId={influencerUserId}
          >
            {profileLinkLabel}
          </DiscoverProfileFromDiscoverLink>
          {!exploreRail && !offerFormOpen ? (
            <button
              className="btn btn--sm marketplace-offer-toggle"
              type="button"
              aria-expanded={offerFormOpen}
              aria-controls={formPanelId}
              onClick={() => setOfferFormOpen(true)}
            >
              {submitButtonLabel}
            </button>
          ) : null}
        </div>
      </div>
      <p className="muted influencer-result-card__meta influencer-result-card__stats">
        Takipçi: {followerCount.toLocaleString("tr-TR")} · Baz fiyat: {basePriceTRY} TRY
      </p>
      {!exploreRail && nicheTrimmed ? (
        <p className="muted influencer-result-card__niche">
          Niş: {truncateText(nicheTrimmed, nicheTruncateLen)}
        </p>
      ) : null}

      {!exploreRail && offerFormOpen ? (
        <TrackedOfferCreateForm
          id={formPanelId}
          className="influencer-result-card__form"
          action="/api/offers/create"
          method="post"
          cardKind="influencer_card"
        >
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
        </TrackedOfferCreateForm>
      ) : null}
    </article>
  );
}
