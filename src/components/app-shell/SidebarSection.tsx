export function SidebarSection({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`app-shell-sidebar__section ${className}`.trim()}>
      {title ? <p className="app-shell-sidebar__section-title">{title}</p> : null}
      <div className="app-shell-sidebar__section-items">{children}</div>
    </div>
  );
}
