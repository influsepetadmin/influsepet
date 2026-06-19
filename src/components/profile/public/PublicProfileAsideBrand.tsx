import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { getPublicProfileBioSummary } from "./publicProfileBioSummary";

export function PublicProfileAsideBrand({ data }: { data: PublicBrandProfileResponse }) {
  const bioSummary = getPublicProfileBioSummary(data.bio);

  if (!bioSummary.isTruncated) return null;

  return (
    <div className="public-profile-aside-stack">
      <div className="public-profile-aside-card">
        <p className="public-profile-aside-card__label">Hakkında</p>
        <p className="public-profile-aside-card__bio public-profile-hero__bio--prose">
          {data.bio!.trim()}
        </p>
      </div>
    </div>
  );
}
