import type { Metadata } from "next";
import { PublicProfileHomeLink } from "@/components/profile/public/PublicProfileHomeLink";
import { PublicProfileHeader } from "@/components/profile/public/PublicProfileHeader";
import { PublicProfileStats } from "@/components/profile/public/PublicProfileStats";
import { VerifiedSocialAccounts } from "@/components/profile/public/VerifiedSocialAccounts";
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

  return (
    <div className="public-profile-page">
      <div className="public-profile-page__inner">
        <div className="public-profile-shell">
          <PublicProfileHomeLink href={homeHref} />
          <PublicProfileHeader data={data} />
          <PublicProfileStats data={data} />
          <VerifiedSocialAccounts accounts={data.verifiedSocialAccounts} />
        </div>
      </div>
    </div>
  );
}
