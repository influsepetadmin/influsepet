import type { ReactNode } from "react";

/**
 * Inline empty state for cards and sections (not full-page).
 */
export function EmptyStateCard({
  title,
  description,
  children,
  icon,
  hint,
}: {
  title: string;
  description: string;
  children?: ReactNode;
  /** Outline glyph (preferred) or short text — same stroke family as metadata icons */
  icon?: ReactNode;
  /** Kısa üst bağlam (ör. ilk adım yönlendirmesi); boş durumlarda tutarlı onboarding. */
  hint?: string;
}) {
  return (
    <div className="empty-state-card">
      {icon ? (
        <div className="empty-state-card__icon" aria-hidden>
          {icon}
        </div>
      ) : null}
      {hint ? (
        <p className="empty-state-card__hint" role="note">
          {hint}
        </p>
      ) : null}
      <p className="empty-state-card__title">{title}</p>
      <p className="muted empty-state-card__desc">{description}</p>
      {children ? <div className="empty-state-card__actions">{children}</div> : null}
    </div>
  );
}
