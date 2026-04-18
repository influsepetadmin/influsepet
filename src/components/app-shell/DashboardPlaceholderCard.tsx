export function DashboardPlaceholderCard({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="app-shell-placeholder-card">
      <h2 className="app-shell-placeholder-card__title">{title}</h2>
      <div className="app-shell-placeholder-card__body">{children}</div>
    </section>
  );
}
