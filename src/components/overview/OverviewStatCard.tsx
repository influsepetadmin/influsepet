import type { ReactNode } from "react";
import Link from "next/link";

export function OverviewStatCard({
  href,
  label,
  value,
  hint,
  icon,
}: {
  href: string;
  label: string;
  value: ReactNode;
  hint?: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="ov-stat-card">
      <div className="ov-stat-card__top">
        <span className="ov-stat-card__label">{label}</span>
        <span className="ov-stat-card__icon" aria-hidden>
          {icon}
        </span>
      </div>
      <span className="ov-stat-card__value">{value}</span>
      {hint ? <span className="ov-stat-card__hint muted">{hint}</span> : null}
    </Link>
  );
}
