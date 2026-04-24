import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { CategoryBadgeGroup } from "./CategoryBadgeGroup";

export function PublicProfileAsideBrand({ data }: { data: PublicBrandProfileResponse }) {
  const hasSectors = data.categories.length > 0;
  const hasBio = Boolean(data.bio?.trim());

  if (!hasSectors && !hasBio) {
    return (
      <div className="public-profile-aside-card public-profile-aside-card--placeholder">
        <p className="muted public-profile-aside-card__placeholder">
          Sektör ve marka tanıtımı eklendiğinde burada görünecek.
        </p>
      </div>
    );
  }

  return (
    <div className="public-profile-aside-stack">
      {hasSectors ? (
        <div className="public-profile-aside-card">
          <p className="public-profile-aside-card__label">Sektör</p>
          <CategoryBadgeGroup bare categories={data.categories} nicheText={null} />
        </div>
      ) : null}
      {hasBio ? (
        <div className="public-profile-aside-card">
          <p className="public-profile-aside-card__label">Hakkında</p>
          <p className="public-profile-aside-card__bio public-profile-hero__bio--prose">
            {data.bio!.trim()}
          </p>
        </div>
      ) : null}
    </div>
  );
}
