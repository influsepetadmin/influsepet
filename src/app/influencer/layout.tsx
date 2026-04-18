import { DashboardShell } from "@/components/app-shell/DashboardShell";
import { getAvatarUrl } from "@/lib/avatar";
import { getCurrentUser } from "@/lib/me";

export default async function InfluencerPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  const userAvatarSrc =
    user?.influencer?.profileImageUrl?.trim() || (user ? getAvatarUrl(user.id) : "");

  return (
    <DashboardShell
      panel="influencer"
      userName={user?.name ?? "Hesap"}
      userAvatarSrc={userAvatarSrc}
      profileHref="/influencer/profile"
      settingsHref="/influencer/settings"
    >
      {children}
    </DashboardShell>
  );
}
