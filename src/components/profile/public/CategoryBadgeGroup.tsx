export type PublicCategoryItem = { key: string; label: string };

type Props = {
  categories: PublicCategoryItem[];
  nicheText: string | null;
  /** Hero içi: kart/section sarmalayıcı olmadan sadece rozetler + niş */
  bare?: boolean;
  /** Tam bölüm başlığı (ör. Kategoriler & niş / Sektör) */
  sectionTitle?: string;
};

export function CategoryBadgeGroup({
  categories,
  nicheText,
  bare,
  sectionTitle = "Kategoriler & niş",
}: Props) {
  if (categories.length === 0 && !nicheText?.trim()) return null;

  const badges = (
    <>
      {categories.length > 0 ? (
        <div className="public-profile-badge-row public-profile-badge-row--wrap">
          {categories.map((c) => (
            <span key={c.key} className="public-profile-badge public-profile-badge--category">
              {c.label}
            </span>
          ))}
        </div>
      ) : null}
      {nicheText?.trim() ? (
        <div className="public-profile-niche-wrap">
          <p className="public-profile-niche">
            <span className="public-profile-niche__label">Niş</span>
            {nicheText.trim()}
          </p>
        </div>
      ) : null}
    </>
  );

  if (bare) {
    return <div className="public-profile-category-bare">{badges}</div>;
  }

  return (
    <section className="public-profile-section" aria-labelledby="public-profile-categories-heading">
      <h2 id="public-profile-categories-heading" className="public-profile-section__title">
        {sectionTitle}
      </h2>
      {badges}
    </section>
  );
}
