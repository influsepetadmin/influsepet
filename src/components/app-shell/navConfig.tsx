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

/** Influencer panel — order: Overview → Discover → Offers → Collaborations → Chats → Profile → Settings */
export const INFLUENCER_NAV: ShellNavItem[] = [
  {
    href: "/influencer/overview",
    label: "Genel bakış",
    icon: LayoutDashboard,
    altExactPaths: ["/influencer"],
    mobileBar: true,
  },
  { href: "/influencer/discover", label: "Keşfet", icon: Compass, mobileBar: true },
  { href: "/influencer/saved", label: "Kayıtlı", icon: Bookmark, mobileBar: true },
  { href: "/influencer/offers", label: "Teklifler", icon: Inbox, mobileBar: true },
  { href: "/influencer/collaborations", label: "İş birlikleri", icon: Briefcase, mobileBar: true },
  { href: "/chat", label: "Sohbetler", icon: MessageCircle, mobileBar: true },
  { href: "/influencer/profile", label: "Profil", icon: User, end: true },
  { href: "/influencer/settings", label: "Ayarlar", icon: Settings, end: true },
];

/** Brand panel — order: Overview → Discover → Offers → Campaigns → Chats → Profile → Settings */
export const MARKA_NAV: ShellNavItem[] = [
  {
    href: "/marka/overview",
    label: "Genel bakış",
    icon: LayoutDashboard,
    altExactPaths: ["/marka"],
    mobileBar: true,
  },
  { href: "/marka/discover", label: "Keşfet", icon: Compass, mobileBar: true },
  { href: "/marka/saved", label: "Kayıtlı", icon: Bookmark, mobileBar: true },
  { href: "/marka/offers", label: "Teklifler", icon: Inbox, mobileBar: true },
  { href: "/marka/campaigns", label: "Kampanyalar", icon: Megaphone, mobileBar: true },
  { href: "/chat", label: "Sohbetler", icon: MessageCircle, mobileBar: true },
  { href: "/marka/profile", label: "Profil", icon: User, end: true },
  { href: "/marka/settings", label: "Ayarlar", icon: Settings, end: true },
];

export { isNavItemActive } from "./navMatch";
