import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
}: {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
}) {
  const hasRow = Boolean(eyebrow || action || description);

  if (!hasRow && !description) {
    return (
      <header className="app-shell-page-header">
        <h1 className="app-shell-page-header__title">{title}</h1>
      </header>
    );
  }

  return (
    <header className="app-shell-page-header">
      <div className="app-shell-page-header__row">
        <div>
          {eyebrow ? <p className="app-shell-page-header__eyebrow">{eyebrow}</p> : null}
          <h1 className="app-shell-page-header__title">{title}</h1>
          {description ? <p className="app-shell-page-header__desc muted">{description}</p> : null}
        </div>
        {action ? <div className="app-shell-page-header__actions">{action}</div> : null}
      </div>
    </header>
  );
}
