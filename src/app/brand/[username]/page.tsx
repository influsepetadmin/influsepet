import type { Metadata } from "next";
import { PublicBrandProfileHeader } from "@/components/profile/public/PublicBrandProfileHeader";
import { PublicBrandProfileStats } from "@/components/profile/public/PublicBrandProfileStats";
import { VerifiedSocialAccounts } from "@/components/profile/public/VerifiedSocialAccounts";
import { PublicProfileNotFound } from "@/components/profile/public/PublicProfileNotFound";
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
  const data = await fetchPublicBrandProfileByUsername(username);

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

  return (
    <div className="public-profile-page public-profile-page--brand">
      <div className="public-profile-page__inner">
        <div className="public-profile-shell">
          <PublicBrandProfileHeader data={data} />
          <PublicBrandProfileStats data={data} />
          <VerifiedSocialAccounts accounts={data.verifiedSocialAccounts} />
        </div>
      </div>
    </div>
  );
}
