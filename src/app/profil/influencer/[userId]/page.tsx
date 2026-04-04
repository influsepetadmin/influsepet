import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardBackHref } from "@/lib/me";
import { getCategoryLabel } from "@/lib/categories";
import { getAvatarUrl } from "@/lib/avatar";
import { platformLabel } from "@/components/social/SocialAccountCard";
import { buildProfileUrl } from "@/lib/socialAccounts";
import { InfluencerPublicReviewsSection } from "@/components/profile/InfluencerPublicReviewsSection";
import { getPublicInfluencerReviewsSectionData } from "@/lib/publicProfile/influencerPublicReviews";

export default async function PublicInfluencerProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const backHref = await getDashboardBackHref();

  const profile = await prisma.influencerProfile.findUnique({
    where: { userId },
    select: {
      username: true,
      profileImageUrl: true,
      city: true,
      followerCount: true,
      basePriceTRY: true,
      bio: true,
      nicheText: true,
      instagramUrl: true,
      tiktokUrl: true,
      user: { select: { name: true } },
      selectedCategories: { select: { categoryKey: true } },
    },
  });

  if (!profile) return notFound();

  const verifiedSocial = await prisma.socialAccount.findMany({
    where: { userId, isVerified: true },
    select: { platform: true, username: true, profileUrl: true },
    orderBy: { platform: "asc" },
  });

  const publicReviews = await getPublicInfluencerReviewsSectionData(userId);

  const cats = profile.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");

  return (
    <section className="card">
      <div className="page-section-header">
        <h2>Influencer profili</h2>
        <Link className="btn secondary" href={backHref}>
          Geri dön
        </Link>
      </div>

      <div className="card card--nested">
        <div className="profile-public-hero">
          <img
            className="profile-public-avatar"
            src={profile.profileImageUrl ?? getAvatarUrl(userId)}
            alt=""
          />
          <div className="profile-stat-grid">
            <p className="profile-public-handle">@{profile.username}</p>
            <p className="muted" style={{ margin: 0 }}>
              {profile.user.name}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Şehir: {profile.city ?? "—"}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Takipçi: {profile.followerCount.toLocaleString("tr-TR")}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Baz fiyat: {profile.basePriceTRY} TRY
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Kategoriler: {cats || "—"}
            </p>
            {profile.nicheText?.trim() ? (
              <p className="muted" style={{ margin: "8px 0 0", lineHeight: 1.45 }}>
                Niş alan: {profile.nicheText.trim()}
              </p>
            ) : null}
          </div>
        </div>
        {profile.bio ? <p style={{ margin: "14px 0 0", lineHeight: 1.55 }}>{profile.bio}</p> : null}
        {verifiedSocial.length > 0 && (
          <p className="muted" style={{ marginTop: 14 }}>
            <strong>Doğrulanmış sosyal hesaplar:</strong>{" "}
            {verifiedSocial.map((s, i) => (
              <span key={`${s.platform}-${s.username}`}>
                {i > 0 ? " · " : null}
                <a
                  href={s.profileUrl ?? buildProfileUrl(s.platform, s.username)}
                  target="_blank"
                  rel="noreferrer"
                >
                  {platformLabel(s.platform)} (@{s.username}) ✓
                </a>
              </span>
            ))}
          </p>
        )}
        {(profile.instagramUrl || profile.tiktokUrl) && (
          <p className="muted" style={{ marginTop: 10, marginBottom: 0 }}>
            {profile.instagramUrl && (
              <a href={profile.instagramUrl} target="_blank" rel="noreferrer">
                Instagram
              </a>
            )}
            {profile.instagramUrl && profile.tiktokUrl ? " · " : null}
            {profile.tiktokUrl && (
              <a href={profile.tiktokUrl} target="_blank" rel="noreferrer">
                TikTok
              </a>
            )}
          </p>
        )}
      </div>

      <InfluencerPublicReviewsSection data={publicReviews} />
    </section>
  );
}
