import type { ReactNode } from "react";
import Link from "next/link";
import "./shell-controls.css";

export function ShellControlBar({ children }: { children: ReactNode }) {
  return <div className="shell-control-bar">{children}</div>;
}

export function ShellTabsRow({
  children,
  "aria-label": ariaLabel,
}: {
  children: ReactNode;
  "aria-label": string;
}) {
  return (
    <div className="shell-control-bar__tabs" role="tablist" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function ShellFiltersBlock({
  filterLabel,
  children,
}: {
  filterLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="shell-control-bar__filters">
      <div className="shell-filter-row">
        <span className="shell-filter-row__label">{filterLabel}</span>
        <div className="shell-filter-row__chips">{children}</div>
      </div>
    </div>
  );
}

export function ShellTabLink({
  href,
  active,
  children,
  count,
}: {
  href: string;
  active: boolean;
  children: ReactNode;
  count?: number;
}) {
  return (
    <Link
      href={href}
      className={`shell-tab${active ? " shell-tab--active" : ""}`}
      role="tab"
      aria-selected={active}
    >
      <span className="shell-tab__label">{children}</span>
      {count !== undefined ? <span className="shell-tab__count">{count}</span> : null}
    </Link>
  );
}

export function ShellFilterChipLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count?: number;
}) {
  return (
    <Link href={href} className={`shell-chip${active ? " shell-chip--active" : ""}`}>
      <span>{label}</span>
      {count !== undefined ? <span className="shell-chip__count">{count}</span> : null}
    </Link>
  );
}

export function ShellPanelHint({ children }: { children: ReactNode }) {
  return <p className="shell-panel-hint muted">{children}</p>;
}
