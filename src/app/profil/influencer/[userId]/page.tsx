import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicInfluencerProfileView } from "@/components/profile/public/PublicInfluencerProfileView";
import { getDashboardBackHref } from "@/lib/me";
import { prisma } from "@/lib/prisma";
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
  const [data, backHref] = await Promise.all([getPublicProfileByUserId(userId), getDashboardBackHref()]);

  if (!data) {
    notFound();
  }

  const publicProfileHref = `/u/${encodeURIComponent(data.username)}`;

  return (
    <PublicInfluencerProfileView
      data={data}
      homeHref={backHref}
      homeLinkLabel="Panele dön"
      appShell
      headerCta={
        <>
          <div className="public-profile-hero__cta-actions">
            <Link className="btn secondary public-profile-hero__cta-btn" href={publicProfileHref}>
              Herkese açık profili görüntüle
            </Link>
          </div>
          <p className="public-profile-hero__cta-hint">
            Teklif ve mesajlaşma için marka panelindeki ilgili teklif veya sohbet akışını kullanın.
          </p>
        </>
      }
    />
  );
}
