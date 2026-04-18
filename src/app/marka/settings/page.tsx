import Link from "next/link";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";

export default async function MarkaSettingsPage() {
  const access = await getMarkaPanelAccess();
  if (access.ok === false) {
    if (access.kind === "admin") {
      return (
        <ForbiddenStateCard
          title="Bu alan marka hesapları içindir"
          description="Yönetici hesabıyla bu panel kullanılamaz."
        />
      );
    }
    return (
      <ForbiddenStateCard
        title="Bu alan marka hesapları içindir"
        description="Şu an influencer hesabıyla giriş yaptınız."
        panelHref="/influencer"
        panelLabel="Influencer paneline git"
      />
    );
  }

  return (
    <div className="dashboard-page influencer-panel-page marka-settings">
      <header className="influencer-panel-page__hero">
        <h1 className="influencer-panel-page__title">Ayarlar</h1>
        <p className="influencer-panel-page__lede muted">Hesap ve tercihler (kademeli genişletilecek).</p>
      </header>

      <div className="influencer-settings__grid">
        <section className="dash-card dash-card--section influencer-settings__card">
          <h2 className="dash-section__title">Hesap</h2>
          <p className="muted dash-section__lede">E-posta ve oturum yönetimi yakında burada toplanacak.</p>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card">
          <h2 className="dash-section__title">Bildirim tercihleri</h2>
          <p className="muted dash-section__lede">
            Placeholder — e-posta ve uygulama bildirimleri için seçenekler eklenecek.
          </p>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card">
          <h2 className="dash-section__title">Şifre</h2>
          <p className="muted dash-section__lede">Şifre sıfırlama ve güvenlik için akış eklenecek.</p>
          <Link className="btn secondary btn--sm" href="/sifremi-unuttum">
            Şifremi unuttum
          </Link>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card">
          <h2 className="dash-section__title">Oturumu kapat</h2>
          <p className="muted dash-section__lede">Güvenli çıkış için oturum çerezi silinir.</p>
          <form action="/api/auth/logout" method="post">
            <button className="btn secondary" type="submit">
              Çıkış yap
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
