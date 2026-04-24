import Link from "next/link";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { InfluencerProfilePanel } from "@/components/dashboard/InfluencerProfilePanel";
import InfluencerPortfolioManager from "@/components/InfluencerPortfolioManager";
import { SocialAccountsSection } from "@/components/social/SocialAccountsSection";
import { getAvatarUrl } from "@/lib/avatar";
import { getCategoryLabel, normalizeCategoryKeysForForm } from "@/lib/categories";
import { isInfluencerDashboardProfileComplete, truncateText } from "@/lib/dashboardProfileCompletion";
import { getInfluencerPanelAccess } from "@/lib/influencer/panelAccess";
import { prisma } from "@/lib/prisma";
import { EmptyGlyphListBullet } from "@/components/icons/emptyStateGlyphs";

function parseProfileTab(raw: string | undefined): "genel" | "sosyal" | "portfoy" | "degerlendirme" {
  if (raw === "sosyal") return "sosyal";
  if (raw === "portfoy") return "portfoy";
  if (raw === "degerlendirme") return "degerlendirme";
  return "genel";
}

export default async function InfluencerProfilePage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; err?: string }>;
}) {
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

  const { user } = access;
  const profile = user.influencer;
  const sp = searchParams ? await searchParams : {};
  const tab = parseProfileTab(sp.tab);
  const err = sp.err;

  const selectedCategoryKeysRaw = profile?.selectedCategories?.map((c) => c.categoryKey) ?? [];
  const selectedCategoryKeys =
    selectedCategoryKeysRaw.length > 0
      ? selectedCategoryKeysRaw.slice(0, 3)
      : profile?.category
        ? [profile.category]
        : [];

  const profileComplete = isInfluencerDashboardProfileComplete(profile, selectedCategoryKeys);
  const categoriesText = selectedCategoryKeys.map((k) => getCategoryLabel(k)).filter(Boolean).join(", ");
  const formCategoryKeys = normalizeCategoryKeysForForm(selectedCategoryKeysRaw, profile?.category);
  const nichePreview = profile?.nicheText?.trim() ? truncateText(profile.nicheText, 140) : null;
  const bioPreview = profile?.bio?.trim() ? truncateText(profile.bio, 120) : null;

  const portfolioItems =
    profile
      ? await prisma.influencerPortfolioItem.findMany({
          where: { influencerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, url: true, platform: true },
          take: 20,
        })
      : [];

  const tabHref = (t: typeof tab) =>
    t === "genel" ? "/influencer/profile" : `/influencer/profile?tab=${t}`;

  return (
    <div className="dashboard-page influencer-panel-page influencer-profile">
      <header className="influencer-panel-page__hero">
        <h1 className="influencer-panel-page__title">Profil</h1>
        <p className="influencer-panel-page__lede muted">
          Görünür bilgilerinizi ve bağlı hesaplarınızı yönetin.
        </p>
        <p className="profile-page__context-hint muted">
          Tamamlanan genel bilgiler ve doğrulanmış hesaplar keşfette daha güçlü görünmenizi sağlar.
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
          Portföy
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
              Kullanıcı adı, şehir ve kategoriler keşfette görünür; eksik bırakmayın.
            </p>
            <InfluencerProfilePanel
              err={err}
              profileComplete={profileComplete}
              displayName={user.name}
              initial={{
                username: profile?.username ?? "",
                followerCount: profile?.followerCount ?? 0,
                basePriceTRY: profile?.basePriceTRY ?? 0,
                city: profile?.city ?? "",
                profileImageUrl: profile?.profileImageUrl ?? "",
                selectedCategoryKeys: formCategoryKeys,
                nicheText: profile?.nicheText ?? "",
                instagramUrl: profile?.instagramUrl ?? "",
                tiktokUrl: profile?.tiktokUrl ?? "",
              }}
              isExistingProfile={Boolean(profile)}
              summary={{
                imageSrc: profile?.profileImageUrl ?? getAvatarUrl(user.id),
                username: profile?.username ?? "",
                city: profile?.city ?? "",
                followerCount: profile?.followerCount ?? 0,
                basePriceTRY: profile?.basePriceTRY ?? 0,
                categoriesText,
                nichePreview,
                bioPreview,
              }}
            />
          </section>

          {profile ? (
            <section className="dash-card dash-card--section profile-preview-cta" aria-labelledby="prof-preview-heading">
              <h2 id="prof-preview-heading" className="dash-section__title">
                Herkese açık profil
              </h2>
              <p className="dash-section__lede muted">
                Markalar ve ziyaretçiler bu sayfada sizi görür; portföy ve iş birliği geçmişinizle birlikte listelenir.
              </p>
              <Link className="profile-preview-cta__card" href={`/u/${encodeURIComponent(profile.username)}`}>
                <img
                  className="profile-preview-cta__avatar"
                  src={profile.profileImageUrl ?? getAvatarUrl(user.id)}
                  alt=""
                />
                <div className="profile-preview-cta__text">
                  <span className="profile-preview-cta__eyebrow muted">Herkese açık profil</span>
                  <span className="profile-preview-cta__name">@{profile.username}</span>
                  <span className="profile-preview-cta__hint muted">Ziyaretçilerin gördüğü sayfayı yeni sekmede açın</span>
                </div>
                <span className="btn secondary btn--sm profile-preview-cta__action">
                  Profili görüntüle
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

      {tab === "portfoy" && profile && (
        <section className="dash-card dash-card--section dash-card--portfolio">
          <h2 className="dash-section__title">Portföy</h2>
          <p className="dash-section__lede muted">
            En iyi içerik örneklerinizi ekleyin; markalar profilinizde bunları görür.
          </p>
          <InfluencerPortfolioManager initialItems={portfolioItems} />
        </section>
      )}

      {tab === "portfoy" && !profile && (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<EmptyGlyphListBullet />}
            hint="Portföy için profil"
            title="Profil gerekli"
            description="Önce genel sekmesinde kullanıcı adı ve temel bilgileri kaydedin; ardından portföy ekleyebilirsiniz."
          >
            <Link className="btn" href="/influencer/profile?tab=genel">
              Genel profile git
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
            <Link className="btn" href="/influencer/offers">
              Tekliflere git
            </Link>
          </EmptyStateCard>
        </section>
      )}
    </div>
  );
}
