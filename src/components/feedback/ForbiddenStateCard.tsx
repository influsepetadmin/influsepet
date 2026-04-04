import Image from "next/image";
import Link from "next/link";

/**
 * Full-page style card when the signed-in user must not access a route.
 */
export function ForbiddenStateCard({
  title,
  description,
  panelHref,
  panelLabel,
}: {
  title: string;
  description: string;
  /** İkinci CTA; verilmezse yalnızca ana sayfa gösterilir (ör. yönetici hesabı). */
  panelHref?: string;
  panelLabel?: string;
}) {
  const showPanel = Boolean(panelHref && panelLabel);
  return (
    <div className="error-state-page">
      <div className="error-state-card card">
        <div className="error-state-brand">
          <Image
            src="/branding/logo-primary.png"
            alt=""
            width={56}
            height={56}
            className="error-state-logo"
            sizes="56px"
          />
          <span className="error-state-brand-name">InfluSepet</span>
        </div>
        <h1 className="error-state-title">{title}</h1>
        <p className="error-state-desc muted">{description}</p>
        <div className="error-state-actions">
          <Link className="btn" href="/">
            Ana sayfaya dön
          </Link>
          {showPanel ? (
            <Link className="btn secondary" href={panelHref!}>
              {panelLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
