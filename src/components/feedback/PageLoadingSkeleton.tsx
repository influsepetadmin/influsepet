/**
 * Lightweight branded placeholder while async routes resolve.
 */
export function PageLoadingSkeleton() {
  return (
    <section className="card page-loading-root" aria-busy="true" aria-label="Yükleniyor">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-line" />
      <div className="skeleton skeleton-line skeleton-line--short" />
      <div className="skeleton skeleton-block" />
      <div className="skeleton skeleton-block" />
      <p className="muted page-loading-hint">Yükleniyor…</p>
    </section>
  );
}
