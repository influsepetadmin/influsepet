import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { getProfileImageOrAvatarUrl } from "@/lib/avatar";
import { getCurrentUser } from "@/lib/me";

export default async function MarkaPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const userAvatarSrc =
    user ? getProfileImageOrAvatarUrl(user.brand?.profileImageUrl, user.id, "brand") : "";

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
