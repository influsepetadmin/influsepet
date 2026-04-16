import type { Metadata } from "next";
import { PublicBrandProfileView } from "@/components/profile/public/PublicBrandProfileView";
import { PublicProfileNotFound } from "@/components/profile/public/PublicProfileNotFound";
import { getDashboardBackHref } from "@/lib/me";
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
  const [data, homeHref] = await Promise.all([
    fetchPublicBrandProfileByUsername(username),
    getDashboardBackHref(),
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

  return <PublicBrandProfileView data={data} homeHref={homeHref} />;
}
