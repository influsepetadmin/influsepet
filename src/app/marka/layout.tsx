import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { getAvatarUrl } from "@/lib/avatar";
import { getCurrentUser } from "@/lib/me";

export default async function MarkaPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const userAvatarSrc =
    user?.brand?.profileImageUrl?.trim() || (user ? getAvatarUrl(user.id) : "");

  return (
    <DashboardShell
      panel="marka"
      userName={user?.name ?? "Hesap"}
      userAvatarSrc={userAvatarSrc}
      profileHref="/marka/profile"
      settingsHref="/marka/settings"
    >
      {children}
    </DashboardShell>
  );
}
