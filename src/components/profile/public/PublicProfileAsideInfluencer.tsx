import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { CategoryBadgeGroup } from "./CategoryBadgeGroup";

export function PublicProfileAsideInfluencer({ data }: { data: PublicProfileByUsernameResponse }) {
  const hasCategories = data.categories.length > 0 || Boolean(data.nicheText?.trim());
  const hasBio = Boolean(data.bio?.trim());

  if (!hasCategories && !hasBio) {
    return (
      <div className="public-profile-aside-card public-profile-aside-card--placeholder">
        <p className="muted public-profile-aside-card__placeholder">
          Kategori ve biyografi eklendiğinde burada görünecek; iş birliği kararı için üstteki
          istatistik ve değerlendirmelere bakın.
        </p>
      </div>
    );
  }

  return (
    <div className="public-profile-aside-stack">
      {hasCategories ? (
        <div className="public-profile-aside-card">
          <p className="public-profile-aside-card__label">Kategoriler & niş</p>
          <CategoryBadgeGroup bare categories={data.categories} nicheText={data.nicheText} />
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
