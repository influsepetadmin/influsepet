import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";
import { platformLabel } from "@/components/social/SocialAccountCard";
import { AdminSocialVerificationActions } from "./AdminSocialVerificationActions";

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminSocialVerificationsPage() {
  const session = await getSessionPayload();
  if (!session) {
    redirect("/?mode=login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { id: true, role: true, email: true, name: true },
  });

  if (!currentUser) {
    redirect("/?mode=login");
  }

  if (currentUser.role !== "ADMIN") {
    return (
      <section className="admin-social-verifications admin-social-verifications--unauthorized">
        <h1>Yetkisiz erişim</h1>
        <p className="muted">Bu sayfayı yalnızca yönetici hesapları görüntüleyebilir.</p>
      </section>
    );
  }

  const [requests, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
    prisma.socialAccount.findMany({
      where: { verificationStatus: "PENDING" },
      orderBy: [{ verificationRequestedAt: "asc" }, { createdAt: "asc" }],
      select: {
        id: true,
        platform: true,
        username: true,
        profileUrl: true,
        verificationCode: true,
        verificationRequestedAt: true,
        user: {
          select: {
            email: true,
            name: true,
          },
        },
      },
    }),
    prisma.socialAccount.count({ where: { verificationStatus: "PENDING" } }),
    prisma.socialAccount.count({ where: { verificationStatus: "VERIFIED" } }),
    prisma.socialAccount.count({ where: { verificationStatus: "REJECTED" } }),
  ]);

  return (
    <section className="admin-social-verifications">
      <header className="admin-social-verifications__shell-head">
        <div className="admin-social-verifications__brand">
          <span className="admin-social-verifications__logo" aria-hidden>
            <img src="/branding/influsepet-logo-icon.png" alt="" width={34} height={34} />
          </span>
          <div>
            <h1>Yönetim Paneli</h1>
            <p className="muted">InfluSepet’in temel yönetim işlemlerini buradan takip edebilirsiniz.</p>
          </div>
        </div>
        <div className="admin-social-verifications__actions">
          <Link className="btn secondary btn--sm" href="/">
            Siteye dön
          </Link>
          <form action="/api/auth/logout" method="post">
            <button className="btn secondary btn--subtle btn--sm" type="submit">
              Çıkış yap
            </button>
          </form>
        </div>
      </header>

      <div className="admin-social-verifications__summary" aria-label="Doğrulama özeti">
        <article className="admin-social-verifications__summary-card">
          <span>{pendingCount}</span>
          <p>Bekleyen doğrulamalar</p>
        </article>
        <article className="admin-social-verifications__summary-card">
          <span>{verifiedCount}</span>
          <p>Onaylanan hesaplar</p>
        </article>
        <article className="admin-social-verifications__summary-card">
          <span>{rejectedCount}</span>
          <p>Reddedilen talepler</p>
        </article>
      </div>

      <div className="dash-card dash-card--section admin-social-verifications__panel">
        <div className="admin-social-verifications__head">
          <h2 className="dash-section__title">Sosyal hesap doğrulama talepleri</h2>
        </div>

        {requests.length === 0 ? (
          <div className="admin-social-verifications__empty">
            <h3>Bekleyen talep yok</h3>
            <p className="muted">İnceleme bekleyen sosyal hesap doğrulama talebi bulunmuyor.</p>
          </div>
        ) : (
          <div className="admin-social-verifications__list">
            {requests.map((request) => (
              <article key={request.id} className="admin-social-verification-card">
                <div className="admin-social-verification-card__main">
                  <div>
                    <p className="muted">Platform</p>
                    <h3 className="dash-section__title">{platformLabel(request.platform)}</h3>
                  </div>
                  <AdminSocialVerificationActions socialAccountId={request.id} />
                </div>

                <dl className="admin-social-verification-card__grid">
                  <div>
                    <dt>Kullanıcı adı</dt>
                    <dd>@{request.username}</dd>
                  </div>
                  <div>
                    <dt>Profil bağlantısı</dt>
                    <dd>
                      {request.profileUrl ? (
                        <a href={request.profileUrl} target="_blank" rel="noreferrer">
                          {request.profileUrl}
                        </a>
                      ) : (
                        "—"
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt>Doğrulama kodu</dt>
                    <dd>
                      <code translate="no">{request.verificationCode ?? "—"}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Talep zamanı</dt>
                    <dd>{formatDate(request.verificationRequestedAt)}</dd>
                  </div>
                  <div>
                    <dt>Hesap sahibi</dt>
                    <dd>{request.user.name}</dd>
                  </div>
                  <div>
                    <dt>E-posta</dt>
                    <dd>{request.user.email}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
