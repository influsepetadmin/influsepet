import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

export const metadata: Metadata = {
  title: "Yönetici girişi",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ err?: string }>;
}) {
  const session = await getSessionPayload();
  if (session) {
    const currentUser = await prisma.user.findUnique({
      where: { id: session.uid },
      select: { role: true },
    });
    if (currentUser?.role === "ADMIN") {
      redirect("/admin/social-verifications");
    }
  }

  const params = await searchParams;
  const err = typeof params?.err === "string" ? params.err : null;

  return (
    <section className="admin-login-page" aria-labelledby="admin-login-heading">
      <div className="auth-card auth-card--compact admin-login-card">
        <div className="auth-card-head">
          <p className="auth-section-label">InfluSepet yönetim</p>
          <h1 id="admin-login-heading" className="auth-card-heading">
            Yönetici girişi
          </h1>
          <p className="auth-card-subline muted">
            Bu alan yalnızca yetkili yönetici hesapları içindir.
          </p>
        </div>

        {err ? (
          <p className="auth-alert" role="alert">
            {err}
          </p>
        ) : null}

        <form action="/api/admin/login" method="post" className="auth-form" autoComplete="on">
          <label htmlFor="admin-login-email">E-posta veya kullanıcı adı</label>
          <input
            id="admin-login-email"
            name="email"
            type="text"
            autoComplete="username"
            required
          />

          <label htmlFor="admin-login-password">Şifre</label>
          <input
            id="admin-login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
          />

          <div className="auth-primary-action">
            <button className="btn" type="submit">
              Yönetici girişi yap
            </button>
          </div>
        </form>

        <p className="auth-card-foot muted">
          <Link href="/">Ana girişe dön</Link>
        </p>
      </div>
    </section>
  );
}
