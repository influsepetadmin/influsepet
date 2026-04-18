"use client";

import { Menu } from "lucide-react";
import { Breadcrumbs } from "./Breadcrumbs";

export function AppTopbar({
  pathname,
  onOpenDrawer,
}: {
  pathname: string;
  onOpenDrawer: () => void;
}) {
  return (
    <header className="app-shell-topbar">
      <button
        type="button"
        className="app-shell-topbar__menu-btn app-shell-topbar__menu-btn--mobile"
        onClick={onOpenDrawer}
        aria-label="Menüyü aç"
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>
      <Breadcrumbs pathname={pathname} />
    </header>
  );
}
