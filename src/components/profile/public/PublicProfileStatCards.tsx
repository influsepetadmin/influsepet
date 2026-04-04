const STAT_ICON: Record<string, string> = {
  "Tamamlanan iş birliği": "✓",
  "Ortalama puan": "★",
  "Puanlama sayısı": "#",
  Takipçi: "◎",
  "Baz fiyat": "₺",
};

export function PublicProfileStatCards({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <div className="public-profile-stats" role="list">
      {items.map((item) => (
        <div key={item.label} className="public-profile-stat-card" role="listitem">
          <span className="public-profile-stat-card__icon" aria-hidden>
            {STAT_ICON[item.label] ?? "·"}
          </span>
          <div className="public-profile-stat-card__body">
            <span className="public-profile-stat-card__label">{item.label}</span>
            <span className="public-profile-stat-card__value">{item.value}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
