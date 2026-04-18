import type { ReactNode } from "react";
import Link from "next/link";

export function QuickActionCard({
  href,
  title,
  description,
  icon,
}: {
  href: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <Link href={href} className="ov-quick-action">
      <span className="ov-quick-action__icon" aria-hidden>
        {icon}
      </span>
      <span className="ov-quick-action__title">{title}</span>
      <p className="ov-quick-action__desc muted">{description}</p>
    </Link>
  );
}
