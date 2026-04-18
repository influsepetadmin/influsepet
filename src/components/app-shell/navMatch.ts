import type { ShellNavItem } from "./navConfig";

/**
 * Reliable active state for shell nav — avoids fragile one-off path checks in components.
 * Chat: /chat and /chat/[conversationId]. Settings/profile: exact when `end` is set.
 */
export function isNavItemActive(pathname: string, item: ShellNavItem): boolean {
  if (item.isActive) {
    return item.isActive(pathname);
  }

  if (item.href === "/chat") {
    return pathname === "/chat" || pathname.startsWith("/chat/");
  }

  if (item.altExactPaths?.some((p) => pathname === p)) {
    return true;
  }

  if (pathname === item.href) {
    return true;
  }

  if (item.end) {
    return false;
  }

  return pathname.startsWith(`${item.href}/`);
}
