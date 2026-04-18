import type { ReactNode } from "react";
import Link from "next/link";

export function OverviewSectionCard({
  title,
  footerHref,
  footerLabel,
  children,
}: {
  title: string;
  footerHref?: string;
  footerLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="ov-section-card">
      <div className="ov-section-card__head">
        <h2 className="ov-section-card__title">{title}</h2>
        {footerHref && footerLabel ? (
          <Link href={footerHref} className="ov-section-card__link">
            {footerLabel}
          </Link>
        ) : null}
      </div>
      <div className="ov-section-card__body">{children}</div>
    </section>
  );
}
