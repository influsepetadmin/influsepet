/**
 * Inline empty state for cards and sections (not full-page).
 */
export function EmptyStateCard({
  title,
  description,
  children,
  icon,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  /** Optional single emoji or short glyph for visual hierarchy */
  icon?: string;
}) {
  return (
    <div className="empty-state-card">
      {icon ? (
        <div className="empty-state-card__icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      <p className="empty-state-card__title">{title}</p>
      <p className="muted empty-state-card__desc">{description}</p>
      {children ? <div className="empty-state-card__actions">{children}</div> : null}
    </div>
  );
}
