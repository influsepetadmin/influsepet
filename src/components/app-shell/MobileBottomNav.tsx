"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import type { ShellNavItem } from "./navConfig";
import { isNavItemActive } from "./navConfig";

/** Mobil alt gezinme çubuğu (temel; masaüstünde gizli). */
export function MobileBottomNav({
  items,
  pathname,
  onOpenDrawer,
}: {
  items: ShellNavItem[];
  pathname: string;
  onOpenDrawer: () => void;
}) {
  const barItems = items.filter((i) => i.mobileBar);

  return (
    <nav className="app-shell-mobile-bar" aria-label="Hızlı gezinme">
      {barItems.map((item) => {
        const Icon = item.icon;
        const active = isNavItemActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`app-shell-mobile-bar__item${active ? " app-shell-mobile-bar__item--active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <Icon size={22} strokeWidth={1.75} aria-hidden />
            <span className="app-shell-mobile-bar__label">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        className="app-shell-mobile-bar__item app-shell-mobile-bar__item--more"
        onClick={onOpenDrawer}
        aria-label="Tüm menü"
      >
        <Menu size={22} strokeWidth={1.75} aria-hidden />
        <span className="app-shell-mobile-bar__label">Menü</span>
      </button>
    </nav>
  );
}
