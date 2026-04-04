import Image from "next/image";

export function ErrorStateCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
}) {
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
        {children ? <div className="error-state-actions">{children}</div> : null}
        {footer ? <div className="error-state-foot muted">{footer}</div> : null}
      </div>
    </div>
  );
}
