import Link from "next/link";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { getInfluencerPanelAccess } from "@/lib/influencer/panelAccess";

export default async function InfluencerSettingsPage() {
  const access = await getInfluencerPanelAccess();
  if (access.ok === false) {
    if (access.kind === "admin") {
      return (
        <ForbiddenStateCard
          title="Bu alan influencer hesapları içindir"
          description="Yönetici hesabıyla bu panel kullanılamaz."
        />
      );
    }
    return (
      <ForbiddenStateCard
        title="Bu alan influencer hesapları içindir"
        description="Şu an marka hesabıyla giriş yaptınız."
        panelHref="/marka"
        panelLabel="Marka paneline git"
      />
    );
  }

  return (
    <div className="dashboard-page influencer-panel-page influencer-settings">
      <header className="influencer-panel-page__hero">
        <h1 className="influencer-panel-page__title">Ayarlar</h1>
        <p className="influencer-panel-page__lede muted">Hesap yönetimi ve tercih alanları adım adım bu sayfaya yakında eklenecek.</p>
      </header>

      <div className="influencer-settings__grid">
        <section className="dash-card dash-card--section influencer-settings__card">
          <h2 className="dash-section__title">Hesap</h2>
          <p className="muted dash-section__lede">E-posta ve oturum bilgileri için detaylı yönetim seçenekleri bu alana yakında eklenecek.</p>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card">
          <h2 className="dash-section__title">Bildirim tercihleri</h2>
          <p className="muted dash-section__lede">E-posta ve uygulama bildirim tercihlerini yönetme seçenekleri bu alana yakında eklenecek.</p>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card">
          <h2 className="dash-section__title">Şifre</h2>
          <p className="muted dash-section__lede">Gelişmiş güvenlik ve şifre yönetimi ayarları bu alana yakında eklenecek.</p>
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
