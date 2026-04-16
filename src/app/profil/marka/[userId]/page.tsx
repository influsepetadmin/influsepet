import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicBrandProfileView } from "@/components/profile/public/PublicBrandProfileView";
import { getDashboardBackHref } from "@/lib/me";
import { getPublicBrandProfileByUserId } from "@/lib/publicProfile/getPublicBrandProfileByUserId";

type Props = { params: Promise<{ userId: string }> };

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
}: Props) {
  const { userId } = await params;
  const [data, backHref] = await Promise.all([
    getPublicBrandProfileByUserId(userId),
    getDashboardBackHref(),
  ]);

  if (!data) {
    notFound();
  }

  const publicProfileHref = `/brand/${encodeURIComponent(data.username)}`;

  return (
    <PublicBrandProfileView
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
            Teklif ve mesajlaşma için influencer panelinizdeki ilgili teklif veya sohbet akışını kullanın.
          </p>
        </>
      }
    />
  );
}
