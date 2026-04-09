import type { Metadata } from "next";
import { PublicInfluencerProfileView } from "@/components/profile/public/PublicInfluencerProfileView";
import { PublicProfileNotFound } from "@/components/profile/public/PublicProfileNotFound";
import { getDashboardBackHref } from "@/lib/me";
import { fetchPublicProfileByUsername } from "@/lib/publicProfile/fetchPublicProfileServer";

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await fetchPublicProfileByUsername(username);
  if (!data) {
    return { title: { absolute: "Profil bulunamadı · InfluSepet" } };
  }
  return {
    title: `${data.name} (@${data.username})`,
    description: data.bio?.trim() || `${data.name} influencer profili`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const [data, homeHref] = await Promise.all([
    fetchPublicProfileByUsername(username),
    getDashboardBackHref(),
  ]);

  if (!data) {
    return (
      <div className="public-profile-page">
        <PublicProfileNotFound />
      </div>
    );
  }

  return <PublicInfluencerProfileView data={data} homeHref={homeHref} />;
}
