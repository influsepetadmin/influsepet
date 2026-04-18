import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { getAvatarUrl } from "@/lib/avatar";
import { getCurrentUser } from "@/lib/me";

/**
 * Chat uses the same dashboard shell as panel routes so navigation stays one system.
 * Unauthenticated visitors still render chat pages (they show login empty states).
 */
export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || (user.role !== "INFLUENCER" && user.role !== "BRAND")) {
    return <>{children}</>;
  }

  const panel = user.role === "BRAND" ? "marka" : "influencer";
  const userAvatarSrc =
    user.role === "BRAND"
      ? user.brand?.profileImageUrl?.trim() || getAvatarUrl(user.id)
      : user.influencer?.profileImageUrl?.trim() || getAvatarUrl(user.id);

  return (
    <DashboardShell
      panel={panel}
      userName={user.name ?? "Hesap"}
      userAvatarSrc={userAvatarSrc}
      profileHref={panel === "marka" ? "/marka/profile" : "/influencer/profile"}
      settingsHref={panel === "marka" ? "/marka/settings" : "/influencer/settings"}
    >
      {children}
    </DashboardShell>
  );
}
