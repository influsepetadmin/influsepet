"use client";

import { PanelLeftClose, PanelLeft } from "lucide-react";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarSection } from "./SidebarSection";
import type { ShellNavGroup } from "./navConfig";
import { isNavItemActive } from "./navConfig";

export function SidebarNav({
  groups,
  pathname,
  collapsed,
  onToggleCollapse,
  onNavigate,
  showCollapseControl = true,
}: {
  groups: ShellNavGroup[];
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate?: () => void;
  /** Hidden in mobile drawer (always expanded list). */
  showCollapseControl?: boolean;
}) {
  return (
    <nav className="app-shell-sidebar__nav" aria-label="Panel menüsü">
      {showCollapseControl ? (
        <div className="app-shell-sidebar__controls">
          <button
            type="button"
            className="app-shell-sidebar__collapse-btn"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            data-tooltip={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
            aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
          >
            {collapsed ? <PanelLeft size={20} strokeWidth={1.75} /> : <PanelLeftClose size={20} strokeWidth={1.75} />}
          </button>
        </div>
      ) : null}

      {groups.map((group, index) => (
        <SidebarSection
          key={group.id}
          title={collapsed ? undefined : group.sectionLabel}
          className={index > 0 ? "app-shell-sidebar__section--below" : ""}
        >
          {group.items.map((item) => (
            <SidebarNavItem
              key={item.href}
              href={item.href}
              label={item.label}
              icon={item.icon}
              active={isNavItemActive(pathname, item)}
              collapsed={collapsed}
              onNavigate={onNavigate}
            />
          ))}
        </SidebarSection>
      ))}
    </nav>
  );
}
