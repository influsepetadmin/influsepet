"use client";

import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
import { SidebarNav } from "./SidebarNav";
import type { ShellNavGroup } from "./navConfig";

export function AppSidebar({
  productName,
  roleLabel,
  homeHref,
  navGroups,
  sidebarTagline,
  pathname,
  collapsed,
  onToggleCollapse,
  userName,
  userAvatarSrc,
  profileHref,
  settingsHref,
  onNavigate,
  onMouseEnter,
  onMouseLeave,
}: {
  /** Product wordmark (compact). */
  productName: string;
  /** Panel role shown next to product (e.g. Influencer / Marka). */
  roleLabel: string;
  homeHref: string;
  navGroups: ShellNavGroup[];
  /** One line under the brand row (hidden when sidebar collapsed). */
  sidebarTagline: string;
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  userName: string;
  userAvatarSrc: string;
  profileHref: string;
  settingsHref: string;
  onNavigate?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const brandAria = `${productName} — ${roleLabel} paneli`;
  return (
    <aside
      className="app-shell__sidebar app-shell__sidebar--desktop"
      aria-label={brandAria}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="app-shell__sidebar-head">
        <Link href={homeHref} className="app-shell__brand" title={brandAria} aria-label={brandAria}>
          <span className="app-shell__brand-mark" aria-hidden />
          <span className="app-shell__brand-stack">
            <span className="app-shell__brand-topline">
              <span className="app-shell__product-name">{productName}</span>
              <span className="app-shell__brand-role-sep" aria-hidden>
                ·
              </span>
              <span className="app-shell__brand-role">{roleLabel}</span>
            </span>
          </span>
        </Link>
        <p className="app-shell__sidebar-tagline muted">{sidebarTagline}</p>
      </div>
      <SidebarNav
        groups={navGroups}
        pathname={pathname}
        collapsed={collapsed}
        onToggleCollapse={onToggleCollapse}
        onNavigate={onNavigate}
      />
      <div className="app-shell__sidebar-footer">
        <Link href={profileHref} className="app-shell__user-block" aria-label={`Profil: ${userName}`}>
          <span className="app-shell__user-avatar">
            {userAvatarSrc ? (
              <img src={userAvatarSrc} alt="" width={40} height={40} className="app-shell__user-avatar-img" />
            ) : (
              <span className="app-shell__user-avatar-fallback" aria-hidden>
                {userName.slice(0, 1).toUpperCase()}
              </span>
            )}
          </span>
          <span className="app-shell__user-meta">
            <span className="app-shell__user-role-chip">{roleLabel}</span>
            <span className="app-shell__user-name">{userName}</span>
            <span className="app-shell__user-cta muted">Profili aç</span>
          </span>
        </Link>
        <div className="app-shell__footer-actions">
          <Link
            href={settingsHref}
            className="app-shell__footer-icon-btn app-shell__footer-icon-btn--quiet"
            aria-label="Ayarlar"
          >
            <Settings size={20} strokeWidth={1.75} />
          </Link>
          <form action="/api/auth/logout" method="post" className="app-shell__logout-form">
            <button
              type="submit"
              className="app-shell__footer-icon-btn app-shell__footer-icon-btn--quiet"
              aria-label="Çıkış yap"
            >
              <LogOut size={20} strokeWidth={1.75} />
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
