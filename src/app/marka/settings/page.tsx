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
        <p className="influencer-panel-page__lede muted">
          Hesap güvenliği ve bildirim tercihleri burada toplanır. Kullanılabilir işlemler aşağıda.
        </p>
      </header>

      <div className="influencer-settings__grid">
        <section className="dash-card dash-card--section influencer-settings__card influencer-settings__card--info">
          <div className="influencer-settings__card-head">
            <h2 className="dash-section__title">Hesap bilgileri</h2>
            <span className="influencer-settings__status">Hazırlanıyor</span>
          </div>
          <p className="muted dash-section__lede">
            E-posta ve güvenlik seçenekleri bu bölümde toplanacak.
          </p>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card influencer-settings__card--info">
          <div className="influencer-settings__card-head">
            <h2 className="dash-section__title">Bildirim tercihleri</h2>
            <span className="influencer-settings__status">Hazırlanıyor</span>
          </div>
          <p className="muted dash-section__lede">
            Teklif, mesaj ve teslim bildirimleri için tercih ekranı hazırlanıyor.
          </p>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card influencer-settings__card--action">
          <div>
            <h2 className="dash-section__title">Şifre işlemleri</h2>
            <p className="muted dash-section__lede">
              Şifrenizi yenilemek için güvenli sıfırlama akışını başlatın.
            </p>
          </div>
          <div className="influencer-settings__actions">
            <Link className="btn secondary btn--sm" href="/sifremi-unuttum">
              Şifre sıfırla
            </Link>
          </div>
        </section>

        <section className="dash-card dash-card--section influencer-settings__card influencer-settings__card--action influencer-settings__card--logout">
          <div>
            <h2 className="dash-section__title">Oturumu kapat</h2>
            <p className="muted dash-section__lede">
              Bu cihazdaki oturum kapatılır ve giriş ekranına yönlendirilirsiniz.
            </p>
          </div>
          <form action="/api/auth/logout" method="post">
            <button className="btn secondary btn--sm" type="submit">
              Çıkış yap
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
