import type { LucideIcon } from "lucide-react";
import {
  Bookmark,
  Briefcase,
  Compass,
  Inbox,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  Settings,
  User,
} from "lucide-react";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Exact pathnames that should also count as active (e.g. panel home redirect). */
  altExactPaths?: string[];
  /** If true, only exact `href` matches (no /child routes). */
  end?: boolean;
  /** Show in mobile bottom bar (first row + “Menü”). */
  mobileBar?: boolean;
  /** Optional override for active detection (see `navMatch.ts`). */
  isActive?: (pathname: string) => boolean;
};

export type ShellNavGroup = {
  id: string;
  /** Section heading in the sidebar (hidden when rail is collapsed). */
  sectionLabel: string;
  items: ShellNavItem[];
};

export function flattenNavGroups(groups: ShellNavGroup[]): ShellNavItem[] {
  return groups.flatMap((g) => g.items);
}

/** Influencer panel — grouped: overview / markalar / iş birliği / hesap */
export const INFLUENCER_NAV_GROUPS: ShellNavGroup[] = [
  {
    id: "overview",
    sectionLabel: "Özet",
    items: [
      {
        href: "/influencer/overview",
        label: "Genel bakış",
        icon: LayoutDashboard,
        altExactPaths: ["/influencer"],
        mobileBar: true,
      },
    ],
  },
  {
    id: "brands",
    sectionLabel: "Markalar",
    items: [
      { href: "/influencer/discover", label: "Marka keşfet", icon: Compass, mobileBar: true },
      { href: "/influencer/saved", label: "Kayıtlı markalar", icon: Bookmark, mobileBar: true },
    ],
  },
  {
    id: "workflow",
    sectionLabel: "İş birliği",
    items: [
      { href: "/influencer/offers", label: "Teklifler", icon: Inbox, mobileBar: true },
      { href: "/influencer/collaborations", label: "İş birlikleri", icon: Briefcase, mobileBar: true },
      { href: "/chat", label: "Sohbetler", icon: MessageCircle, mobileBar: true },
    ],
  },
  {
    id: "account",
    sectionLabel: "Hesap",
    items: [
      { href: "/influencer/profile", label: "Profil", icon: User, end: true },
      { href: "/influencer/settings", label: "Ayarlar", icon: Settings, end: true },
    ],
  },
];

/** Marka panel — grouped: overview / içerik üreticileri / iş birliği / hesap */
export const MARKA_NAV_GROUPS: ShellNavGroup[] = [
  {
    id: "overview",
    sectionLabel: "Özet",
    items: [
      {
        href: "/marka/overview",
        label: "Genel bakış",
        icon: LayoutDashboard,
        altExactPaths: ["/marka"],
        mobileBar: true,
      },
    ],
  },
  {
    id: "creators",
    sectionLabel: "İçerik üreticileri",
    items: [
      { href: "/marka/discover", label: "İçerik üreticisi keşfet", icon: Compass, mobileBar: true },
      { href: "/marka/saved", label: "Kayıtlı içerik üreticileri", icon: Bookmark, mobileBar: true },
    ],
  },
  {
    id: "workflow",
    sectionLabel: "İş birliği",
    items: [
      { href: "/marka/offers", label: "Teklifler", icon: Inbox, mobileBar: true },
      { href: "/marka/campaigns", label: "Kampanyalar", icon: Megaphone, mobileBar: true },
      { href: "/chat", label: "Sohbetler", icon: MessageCircle, mobileBar: true },
    ],
  },
  {
    id: "account",
    sectionLabel: "Hesap",
    items: [
      { href: "/marka/profile", label: "Marka profili", icon: User, end: true },
      { href: "/marka/settings", label: "Ayarlar", icon: Settings, end: true },
    ],
  },
];

/** Flat list for mobile bar and legacy consumers. */
export const INFLUENCER_NAV: ShellNavItem[] = flattenNavGroups(INFLUENCER_NAV_GROUPS);
export const MARKA_NAV: ShellNavItem[] = flattenNavGroups(MARKA_NAV_GROUPS);

export { isNavItemActive } from "./navMatch";
