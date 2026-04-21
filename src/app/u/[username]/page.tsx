import type { Metadata } from "next";
import { PublicInfluencerProfileView } from "@/components/profile/public/PublicInfluencerProfileView";
import { PublicProfileNotFound } from "@/components/profile/public/PublicProfileNotFound";
import { isOwnInfluencerPublicProfile } from "@/lib/publicProfile/isOwnInfluencerPublicProfile";
import { getCurrentUser, getDashboardBackHref } from "@/lib/me";
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
  const [data, homeHref, user] = await Promise.all([
    fetchPublicProfileByUsername(username),
    getDashboardBackHref(),
    getCurrentUser(),
  ]);

  if (!data) {
    return (
      <div className="public-profile-page">
        <PublicProfileNotFound />
      </div>
    );
  }

  const viewer =
    user && user.role === "INFLUENCER" && user.influencer
      ? { id: user.id, role: user.role, influencer: { username: user.influencer.username } }
      : user
        ? { id: user.id, role: user.role, influencer: null as null }
        : null;

  const isOwnPublicProfile = isOwnInfluencerPublicProfile(viewer, data.id, data.username);

  return (
    <PublicInfluencerProfileView data={data} homeHref={homeHref} isOwnPublicProfile={isOwnPublicProfile} />
  );
}
