import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicInfluencerProfileView } from "@/components/profile/public/PublicInfluencerProfileView";
import { isOwnInfluencerPublicProfile } from "@/lib/publicProfile/isOwnInfluencerPublicProfile";
import { getCurrentUser, getDashboardBackHref } from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { findLatestConversationBetweenBrandAndInfluencer } from "@/lib/conversations/findLatestConversationBetweenBrandAndInfluencer";
import { getPublicProfileByUserId } from "@/lib/publicProfile/getPublicProfileByUserId";

type Props = { params: Promise<{ userId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const row = await prisma.influencerProfile.findUnique({
    where: { userId },
    select: {
      username: true,
      bio: true,
      user: { select: { name: true, role: true } },
    },
  });
  if (!row || row.user.role !== "INFLUENCER") {
    return { title: { absolute: "Profil bulunamadı · InfluSepet" } };
  }
  return {
    title: `${row.user.name} (@${row.username})`,
    description: row.bio?.trim() || `${row.user.name} influencer profili`,
  };
}

export default async function BrandPanelInfluencerProfilePage({ params }: Props) {
  const { userId } = await params;
  const [data, backHref, user] = await Promise.all([
    getPublicProfileByUserId(userId),
    getDashboardBackHref(),
    getCurrentUser(),
  ]);

  if (!data) {
    notFound();
  }

  const viewer =
    user && user.role === "INFLUENCER" && user.influencer
      ? { id: user.id, role: user.role, influencer: { username: user.influencer.username } }
      : user
        ? { id: user.id, role: user.role, influencer: null as null }
        : null;

  const isOwnPublicProfile = isOwnInfluencerPublicProfile(viewer, data.id, data.username);

  const publicProfileHref = `/u/${encodeURIComponent(data.username)}`;

  const canSendCollaborationRequest = user?.role === "BRAND";
  let chatHref: string | null = null;
  if (user?.role === "BRAND" && !isOwnPublicProfile) {
    const cid = await findLatestConversationBetweenBrandAndInfluencer(user.id, data.id);
    if (cid) chatHref = `/chat/${cid}`;
  }

  return (
    <PublicInfluencerProfileView
      data={data}
      homeHref={backHref}
      homeLinkLabel="Panele dön"
      appShell
      isOwnPublicProfile={isOwnPublicProfile}
      chatHref={chatHref}
      canSendCollaborationRequest={canSendCollaborationRequest}
      headerCta={
        <div className="public-profile-hero__panel-tools">
          <Link className="btn secondary btn--sm public-profile-hero__cta-btn" href={publicProfileHref}>
            Herkese açık profil
          </Link>
          <p className="public-profile-hero__cta-hint public-profile-hero__cta-hint--tight">
            Teklif ve sohbet marka panelinden de yönetilir.
          </p>
        </div>
      }
    />
  );
}
