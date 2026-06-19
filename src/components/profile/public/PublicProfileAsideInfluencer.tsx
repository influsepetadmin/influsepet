import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { getPublicProfileBioSummary } from "./publicProfileBioSummary";

export function PublicProfileAsideInfluencer({ data }: { data: PublicProfileByUsernameResponse }) {
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
