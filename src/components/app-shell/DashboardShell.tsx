"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { AppTopbar } from "./AppTopbar";
import { AppSidebar } from "./AppSidebar";
import { SidebarNav } from "./SidebarNav";
import { MobileBottomNav } from "./MobileBottomNav";
import {
  flattenNavGroups,
  INFLUENCER_NAV_GROUPS,
  MARKA_NAV_GROUPS,
  type ShellNavItem,
} from "./navConfig";
import "./app-shell.css";

const COLLAPSED_KEY = "influsepet-sidebar-collapsed";

const collapsedListeners = new Set<() => void>();

function subscribeCollapsed(onStoreChange: () => void) {
  collapsedListeners.add(onStoreChange);
  return () => {
    collapsedListeners.delete(onStoreChange);
  };
}

function getCollapsedSnapshot(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function persistCollapsed(next: boolean) {
  try {
    localStorage.setItem(COLLAPSED_KEY, String(next));
  } catch {
    /* ignore */
  }
  collapsedListeners.forEach((l) => l());
}

export function DashboardShell({
  panel,
  userName,
  userAvatarSrc,
  profileHref,
  settingsHref,
  children,
}: {
  panel: "influencer" | "marka";
  userName: string;
  userAvatarSrc: string;
  profileHref: string;
  settingsHref: string;
  children: React.ReactNode;
}) {
  const navGroups = panel === "influencer" ? INFLUENCER_NAV_GROUPS : MARKA_NAV_GROUPS;
  const navItems: ShellNavItem[] = flattenNavGroups(navGroups);
  const roleLabel = panel === "influencer" ? "Influencer" : "Marka";
  const homeHref = panel === "influencer" ? "/influencer/overview" : "/marka/overview";
  const sidebarTagline =
    panel === "influencer"
      ? "Markaları keşfedin, teklif verin ve iş birliklerinizi yönetin."
      : "İçerik üreticilerini bulun, teklif alın ve kampanyaları takip edin.";
  const pathname = usePathname() ?? "";
  const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsedSnapshot, () => false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);

  const toggleCollapse = useCallback(() => {
    persistCollapsed(!getCollapsedSnapshot());
  }, []);

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const collapsedClass = collapsed ? " app-shell--sidebar-collapsed" : "";
  const hoverClass = collapsed && sidebarHovered ? " app-shell--sidebar-hover" : "";

  return (
    <div
      className={`app-shell${collapsedClass}${hoverClass}`}
      data-app-shell="dashboard"
      data-sidebar-collapsed={collapsed ? "true" : "false"}
    >
      {drawerOpen ? (
        <button
          type="button"
          className="app-shell__drawer-backdrop"
          aria-label="Menüyü kapat"
          onClick={closeDrawer}
        />
      ) : null}

      <AppSidebar
        productName="Influsepet"
        roleLabel={roleLabel}
        homeHref={homeHref}
        navGroups={navGroups}
        sidebarTagline={sidebarTagline}
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapse}
        userName={userName}
        userAvatarSrc={userAvatarSrc}
        profileHref={profileHref}
        settingsHref={settingsHref}
        onNavigate={closeDrawer}
        onMouseEnter={() => setSidebarHovered(true)}
        onMouseLeave={() => setSidebarHovered(false)}
      />

      <aside
        className={`app-shell__drawer${drawerOpen ? " app-shell__drawer--open" : ""}`}
        aria-hidden={!drawerOpen}
        id="app-shell-drawer"
      >
        <div className="app-shell__drawer-inner">
          <p className="app-shell__drawer-title">Influsepet · {roleLabel}</p>
          <SidebarNav
            groups={navGroups}
            pathname={pathname}
            collapsed={false}
            onToggleCollapse={() => {}}
            onNavigate={closeDrawer}
            showCollapseControl={false}
          />
          <div className="app-shell__drawer-footer">
            <Link href={profileHref} className="btn secondary btn--sm" onClick={closeDrawer}>
              Profil
            </Link>
            <Link href={settingsHref} className="btn secondary btn--sm" onClick={closeDrawer}>
              Ayarlar
            </Link>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="btn secondary btn--sm">
                Çıkış
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="app-shell__main">
        <AppTopbar pathname={pathname} onOpenDrawer={() => setDrawerOpen(true)} />
        <div className="app-shell__content">{children}</div>
      </div>

      <MobileBottomNav
        items={navItems}
        pathname={pathname}
        onOpenDrawer={() => setDrawerOpen(true)}
      />
    </div>
  );
}
