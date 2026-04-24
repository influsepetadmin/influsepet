import Link from "next/link";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { BrandProfilePanel } from "@/components/dashboard/BrandProfilePanel";
import { SocialAccountsSection } from "@/components/social/SocialAccountsSection";
import { getAvatarUrl } from "@/lib/avatar";
import { getCategoryLabel } from "@/lib/categories";
import { isBrandDashboardProfileComplete } from "@/lib/dashboardProfileCompletion";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";

function parseProfileTab(raw: string | undefined): "genel" | "sosyal" | "portfoy" | "degerlendirme" {
  if (raw === "sosyal") return "sosyal";
  if (raw === "portfoy") return "portfoy";
  if (raw === "degerlendirme") return "degerlendirme";
  return "genel";
}

export default async function MarkaProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; err?: string }>;
}) {
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

  const { user } = access;
  const profile = user.brand;
  const sp = searchParams ? await searchParams : {};
  const tab = parseProfileTab(sp.tab);
  const err = sp.err;

  const profileComplete = isBrandDashboardProfileComplete(profile);
  const categoriesText =
    profile?.selectedCategories?.map((c) => getCategoryLabel(c.categoryKey)).filter(Boolean).join(", ") ?? "";

  const tabHref = (t: typeof tab) => (t === "genel" ? "/marka/profile" : `/marka/profile?tab=${t}`);

  return (
    <div className="dashboard-page influencer-panel-page marka-profile">
      <header className="influencer-panel-page__hero">
        <h1 className="influencer-panel-page__title">Profil</h1>
        <p className="influencer-panel-page__lede muted">
          Marka bilgileri, sosyal hesaplar ve herkese açık sayfa ayarları.
        </p>
        <p className="profile-page__context-hint muted">
          Eksiksiz şirket profili keşfet ve teklif adımlarında daha net görünmenizi sağlar.
        </p>
      </header>

      <div className="influencer-tab-bar influencer-tab-bar--scroll" role="tablist" aria-label="Profil bölümleri">
        <Link
          className={`influencer-tab-bar__tab${tab === "genel" ? " influencer-tab-bar__tab--active" : ""}`}
          href={tabHref("genel")}
          role="tab"
          aria-selected={tab === "genel"}
        >
          Genel profil
        </Link>
        <Link
          className={`influencer-tab-bar__tab${tab === "sosyal" ? " influencer-tab-bar__tab--active" : ""}`}
          href={tabHref("sosyal")}
          role="tab"
          aria-selected={tab === "sosyal"}
        >
          Sosyal hesaplar
        </Link>
        <Link
          className={`influencer-tab-bar__tab${tab === "portfoy" ? " influencer-tab-bar__tab--active" : ""}`}
          href={tabHref("portfoy")}
          role="tab"
          aria-selected={tab === "portfoy"}
        >
          Portföy / medya
        </Link>
        <Link
          className={`influencer-tab-bar__tab${tab === "degerlendirme" ? " influencer-tab-bar__tab--active" : ""}`}
          href={tabHref("degerlendirme")}
          role="tab"
          aria-selected={tab === "degerlendirme"}
        >
          Değerlendirmeler
        </Link>
      </div>

      {tab === "genel" && (
        <>
          <section className="dash-card dash-card--section">
            <h2 className="dash-section__title">Profil bilgileri</h2>
            <p className="dash-section__microhint muted">
              Şirket adı, şehir ve kategoriler keşfette görünür; herkese açık kullanıcı adını tanımlayın.
            </p>
            <BrandProfilePanel
              err={err}
              profileComplete={profileComplete}
              displayName={user.name}
              initial={{
                companyName: profile?.companyName ?? "",
                city: profile?.city ?? "",
                website: profile?.website ?? "",
                profileImageUrl: profile?.profileImageUrl ?? "",
                username: profile?.username ?? "",
                bio: profile?.bio ?? "",
                selectedCategoryKeys: profile?.selectedCategories?.map((c) => c.categoryKey) ?? [],
              }}
              isExistingProfile={Boolean(profile)}
              summary={{
                imageSrc: profile?.profileImageUrl ?? getAvatarUrl(user.id),
                companyName: profile?.companyName ?? "",
                city: profile?.city ?? "",
                websiteUrl: profile?.website?.trim() || null,
                publicUsername: profile?.username?.trim() ? profile.username.trim() : null,
              }}
            />
          </section>

          {profile?.username?.trim() ? (
            <section className="dash-card dash-card--section profile-preview-cta" aria-labelledby="marka-prof-preview">
              <h2 id="marka-prof-preview" className="dash-section__title">
                Herkese açık marka sayfası
              </h2>
              <p className="dash-section__lede muted">
                Ziyaretçiler markanızı bu adreste görür; kategori ve iletişim bilgileri listelenir.
                {categoriesText ? ` Kategoriler: ${categoriesText}.` : ""}
              </p>
              <Link
                className="profile-preview-cta__card"
                href={`/brand/${encodeURIComponent(profile.username.trim())}`}
              >
                <img
                  className="profile-preview-cta__avatar"
                  src={profile.profileImageUrl ?? getAvatarUrl(user.id)}
                  alt=""
                />
                <div className="profile-preview-cta__text">
                  <span className="profile-preview-cta__eyebrow muted">Herkese açık profil</span>
                  <span className="profile-preview-cta__name">@{profile.username.trim()}</span>
                  <span className="profile-preview-cta__hint muted">Ziyaretçilerin gördüğü sayfayı açın</span>
                </div>
                <span className="btn secondary btn--sm profile-preview-cta__action">
                  Sayfayı görüntüle
                </span>
              </Link>
            </section>
          ) : null}
        </>
      )}

      {tab === "sosyal" && (
        <section className="dash-card dash-card--section">
          <h2 className="dash-section__title">Sosyal hesaplar</h2>
          <p className="dash-section__lede muted">Bağlı platformlar ve doğrulama durumu.</p>
          <SocialAccountsSection />
        </section>
      )}

      {tab === "portfoy" && (
        <section className="dash-card dash-card--section">
          <h2 className="dash-section__title">Portföy / medya</h2>
          <EmptyStateCard
            icon={<EmptyGlyphListBullet />}
            hint="Yakında"
            title="Portföy alanı hazırlanıyor"
            description="Marka vitrini ve medya kütüphanesi eklendiğinde burada yönetilecek. Şimdilik teklif ve sohbet üzerinden içerik akışını sürdürün."
          >
            <Link className="btn" href="/marka/offers">
              Tekliflere git
            </Link>
          </EmptyStateCard>
        </section>
      )}

      {tab === "degerlendirme" && (
        <section className="dash-card dash-card--section">
          <h2 className="dash-section__title">Değerlendirmeler</h2>
          <EmptyStateCard
            icon={<EmptyGlyphListBullet />}
            hint="Tamamlanan iş birlikleri"
            title="Henüz özet yok"
            description="Tamamlanan iş birliklerinden gelen herkese açık değerlendirmeler burada listelenecek. Önce teklif süreçlerini ilerletin."
          >
            <Link className="btn" href="/marka/offers">
              Tekliflere git
            </Link>
          </EmptyStateCard>
        </section>
      )}
    </div>
  );
}
