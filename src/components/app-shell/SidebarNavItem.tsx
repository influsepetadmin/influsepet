"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function SidebarNavItem({
  href,
  label,
  icon: Icon,
  active,
  collapsed,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="app-shell-sidebar-item-wrap">
      <Link
        href={href}
        className={`app-shell-sidebar-item${active ? " app-shell-sidebar-item--active" : ""}`}
        data-tooltip={label}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        onClick={() => onNavigate?.()}
      >
        <span className="app-shell-sidebar-item__icon" aria-hidden>
          <Icon size={20} strokeWidth={1.75} />
        </span>
        <span className="app-shell-sidebar-item__label">{label}</span>
      </Link>
    </div>
  );
}
