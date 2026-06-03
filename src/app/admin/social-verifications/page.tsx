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

  const requests = await prisma.socialAccount.findMany({
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
  });

  return (
    <section className="admin-social-verifications">
      <div className="admin-social-verifications__head">
        <p className="muted">Yönetici</p>
        <h1>Sosyal hesap doğrulama talepleri</h1>
        <p className="muted">
          Bekleyen Instagram, TikTok ve YouTube bio kodu doğrulama taleplerini inceleyin.
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="dash-card dash-card--section">
          <h2 className="dash-section__title">Bekleyen talep yok</h2>
          <p className="muted">İnceleme bekleyen sosyal hesap doğrulama talebi bulunmuyor.</p>
        </div>
      ) : (
        <div className="admin-social-verifications__list">
          {requests.map((request) => (
            <article key={request.id} className="dash-card dash-card--section admin-social-verification-card">
              <div className="admin-social-verification-card__main">
                <div>
                  <p className="muted">Platform</p>
                  <h2 className="dash-section__title">{platformLabel(request.platform)}</h2>
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
    </section>
  );
}
