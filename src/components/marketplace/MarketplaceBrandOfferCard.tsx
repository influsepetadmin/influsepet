"use client";

import type { MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { trackFirstTimeOnce, trackProductEvent } from "@/lib/productTracking/productEvents";
import { getAvatarUrl } from "@/lib/avatar";
import { DiscoverProfileFromDiscoverLink } from "@/components/marketplace/DiscoverProfileFromDiscoverLink";
import { DiscoverySaveButton } from "./DiscoverySaveButton";
import { TrackedOfferCreateForm } from "@/components/marketplace/TrackedOfferCreateForm";

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
  exploreRail?: boolean;
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
  exploreRail = false,
}: MarketplaceBrandOfferCardProps) {
  const router = useRouter();
  const profileHref = `/profil/marka/${brandUserId}?from=discover`;

  function onCardClick(e: MouseEvent<HTMLElement>) {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    if (target.closest("a,button,input,textarea,select,label,[role='button']")) return;
    trackProductEvent({
      event: "profile_cta_click",
      location: "discover",
      label: "profile_brand",
      targetUserId: brandUserId,
    });
    trackFirstTimeOnce("influsepet_ft_profile_from_discover_brand", {
      event: "first_profile_visit_from_discover",
      location: "discover",
      label: "profile_brand",
      targetUserId: brandUserId,
    });
    router.push(profileHref);
  }

  return (
    <article className={`${cardClassName} discover-card-clickable`} onClick={onCardClick}>
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
          <DiscoverProfileFromDiscoverLink
            className="btn secondary btn--sm"
            href={profileHref}
            profileRole="brand"
            targetUserId={brandUserId}
          >
            {profileLinkLabel}
          </DiscoverProfileFromDiscoverLink>
        </div>
      </div>

      {!exploreRail ? (
        <TrackedOfferCreateForm
          className="brand-result-card__form"
          action="/api/offers/create"
          method="post"
          cardKind="brand_card"
        >
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
        </TrackedOfferCreateForm>
      ) : null}
    </article>
  );
}
