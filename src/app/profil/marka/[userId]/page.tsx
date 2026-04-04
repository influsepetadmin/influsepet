import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDashboardBackHref } from "@/lib/me";
import { getAvatarUrl } from "@/lib/avatar";
import { platformLabel } from "@/components/social/SocialAccountCard";
import { buildProfileUrl } from "@/lib/socialAccounts";

export default async function PublicBrandProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const backHref = await getDashboardBackHref();

  const profile = await prisma.brandProfile.findUnique({
    where: { userId },
    select: {
      companyName: true,
      profileImageUrl: true,
      city: true,
      website: true,
      user: { select: { name: true } },
    },
  });

  if (!profile) return notFound();

  const verifiedSocial = await prisma.socialAccount.findMany({
    where: { userId, isVerified: true },
    select: { platform: true, username: true, profileUrl: true },
    orderBy: { platform: "asc" },
  });

  return (
    <section className="card">
      <div className="page-section-header">
        <h2>Marka profili</h2>
        <Link className="btn secondary" href={backHref}>
          Geri dön
        </Link>
      </div>

      <div className="card card--nested">
        <div className="profile-public-hero">
          <img
            className="profile-public-avatar profile-public-avatar--brand"
            src={profile.profileImageUrl ?? getAvatarUrl(userId)}
            alt=""
          />
          <div className="profile-stat-grid">
            <p className="profile-public-handle" style={{ marginBottom: 4 }}>
              {profile.companyName}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              {profile.user.name}
            </p>
            <p className="muted" style={{ margin: 0 }}>
              Şehir: {profile.city ?? "—"}
            </p>
            {profile.website ? (
              <p style={{ margin: 0 }}>
                <a href={profile.website} target="_blank" rel="noreferrer">
                  Web sitesi
                </a>
              </p>
            ) : null}
          </div>
        </div>
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
      </div>
    </section>
  );
}
