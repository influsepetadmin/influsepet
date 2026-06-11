import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PublicBrandProfileView } from "@/components/profile/public/PublicBrandProfileView";
import { isOwnBrandPublicProfile } from "@/lib/publicProfile/isOwnBrandPublicProfile";
import { getCurrentUser, getDashboardBackHref } from "@/lib/me";
import { findLatestConversationBetweenBrandAndInfluencer } from "@/lib/conversations/findLatestConversationBetweenBrandAndInfluencer";
import { getPublicBrandProfileByUserId } from "@/lib/publicProfile/getPublicBrandProfileByUserId";

type Props = {
  params: Promise<{ userId: string }>;
  searchParams?: Promise<{ from?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const data = await getPublicBrandProfileByUserId(userId);
  if (!data) {
    return { title: { absolute: "Profil bulunamadı · InfluSepet" } };
  }
  return {
    title: `${data.name} (@${data.username})`,
    description: data.bio?.trim() || `${data.name} marka profili`,
  };
}

export default async function InfluencerPanelBrandProfilePage({
  params,
  searchParams,
}: Props) {
  const { userId } = await params;
  const urlSearchParams = searchParams ? await searchParams : undefined;
  const cameFromDiscover = (urlSearchParams?.from ?? "").toLowerCase() === "discover";
  const [data, backHref, user] = await Promise.all([
    getPublicBrandProfileByUserId(userId),
    getDashboardBackHref(),
    getCurrentUser(),
  ]);

  if (!data) {
    notFound();
  }

  const viewer =
    user && user.role === "BRAND" && user.brand
      ? { id: user.id, role: user.role, brand: { username: user.brand.username } }
      : user
        ? { id: user.id, role: user.role, brand: null as null }
        : null;

  const isOwnPublicProfile = isOwnBrandPublicProfile(viewer, data.id, data.username);

  const viewerRole =
    user && (user.role === "INFLUENCER" || user.role === "BRAND") ? user.role : null;
  let chatHref: string | null = null;
  if (user?.role === "INFLUENCER" && !isOwnPublicProfile) {
    const cid = await findLatestConversationBetweenBrandAndInfluencer(data.id, user.id);
    if (cid) chatHref = `/chat/${cid}`;
  }

  return (
    <PublicBrandProfileView
      data={data}
      homeHref={backHref}
      homeLinkLabel="Panele dön"
      appShell
      isOwnPublicProfile={isOwnPublicProfile}
      chatHref={chatHref}
      viewerRole={viewerRole}
      cameFromDiscover={cameFromDiscover}
    />
  );
}
