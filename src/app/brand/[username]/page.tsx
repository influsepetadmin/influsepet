import type { Metadata } from "next";
import { PublicBrandProfileView } from "@/components/profile/public/PublicBrandProfileView";
import { PublicProfileNotFound } from "@/components/profile/public/PublicProfileNotFound";
import { isOwnBrandPublicProfile } from "@/lib/publicProfile/isOwnBrandPublicProfile";
import { getCurrentUser, getDashboardBackHref } from "@/lib/me";
import { fetchPublicBrandProfileByUsername } from "@/lib/publicProfile/fetchPublicBrandProfileServer";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchPublicBrandProfileByUsername(username);
  if (!data) {
    return { title: { absolute: "Marka profili bulunamadı · InfluSepet" } };
  }
  return {
    title: `${data.name} (@${data.username})`,
    description: data.bio?.trim() || `${data.name} marka profili`,
  };
}

export default async function PublicBrandProfilePage({ params }: Props) {
  const { username } = await params;
  const [data, homeHref, user] = await Promise.all([
    fetchPublicBrandProfileByUsername(username),
    getDashboardBackHref(),
    getCurrentUser(),
  ]);

  if (!data) {
    return (
      <div className="public-profile-page public-profile-page--brand">
        <PublicProfileNotFound
          title="Marka profili bulunamadı"
          description="Bu kullanıcı adıyla kayıtlı bir marka profili yok veya herkese açık kullanıcı adı henüz tanımlanmadı."
        />
      </div>
    );
  }

  const viewer =
    user && user.role === "BRAND" && user.brand
      ? { id: user.id, role: user.role, brand: { username: user.brand.username } }
      : user
        ? { id: user.id, role: user.role, brand: null as null }
        : null;

  const isOwnPublicProfile = isOwnBrandPublicProfile(viewer, data.id, data.username);

  return <PublicBrandProfileView data={data} homeHref={homeHref} isOwnPublicProfile={isOwnPublicProfile} />;
}
