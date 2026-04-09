import Link from "next/link";
import { redirect } from "next/navigation";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { getCurrentUser } from "@/lib/me";
import { prisma } from "@/lib/prisma";
import { getAvatarUrl } from "@/lib/avatar";
import { getCategoryLabel, normalizeCategoryKeysForForm } from "@/lib/categories";
import {
  isInfluencerDashboardProfileComplete,
  truncateText,
} from "@/lib/dashboardProfileCompletion";
import { InfluencerProfilePanel } from "@/components/dashboard/InfluencerProfilePanel";
import InfluencerPortfolioManager from "@/components/InfluencerPortfolioManager";
import CitySelect from "@/components/CitySelect";
import { CollaborationCard } from "@/components/offers/CollaborationCard";
import { toCollaborationCardOffer } from "@/components/offers/collaborationCardOffer";
import { getRateeReputationByUserIds } from "@/lib/offers/rateeReputation";
import { getAvailableOfferTransitions } from "@/lib/offers/transitions";
import { SocialAccountsSection } from "@/components/social/SocialAccountsSection";

const offerDashboardSelect = {
  id: true,
  title: true,
  campaignName: true,
  brief: true,
  offerAmountTRY: true,
  budgetTRY: true,
  commissionRate: true,
  commissionTRY: true,
  netPayoutTRY: true,
  status: true,
  initiatedBy: true,
  brandId: true,
  influencerId: true,
  dueDate: true,
  deliverableType: true,
  deliverableCount: true,
  revisionCount: true,
  createdAt: true,
  updatedAt: true,
  conversation: { select: { id: true } },
  _count: { select: { deliveries: true } },
} as const;

export default async function InfluencerPage({
  searchParams,
}: {
  searchParams?: Promise<{ err?: string; city?: string }>;
}) {
  const user = await getCurrentUser();
  const params = searchParams ? await searchParams : undefined;
  const err = params?.err;
  const city = (params?.city ?? "").trim();
  const hasBrandSearch = Boolean(city);

  if (!user) {
    redirect("/?role=INFLUENCER&mode=login");
  }

  if (user.role === "ADMIN") {
    return (
      <ForbiddenStateCard
        title="Bu alan influencer hesapları içindir"
        description="Yönetici hesabıyla bu panel kullanılamaz."
      />
    );
  }

  if (user.role !== "INFLUENCER") {
    return (
      <ForbiddenStateCard
        title="Bu alan influencer hesapları içindir"
        description="Şu an marka hesabıyla giriş yaptınız. Marka işlemleri için marka panelini kullanın."
        panelHref="/marka"
        panelLabel="Marka paneline git"
      />
    );
  }

  const profile = user.influencer;
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

  const sessionUser = { id: user.id, role: user.role };

  const [socialLinkedCount, pipelineOfferCount, pendingOfferCount, portfolioItemCount] =
    await Promise.all([
      prisma.socialAccount.count({ where: { userId: user.id, isConnected: true } }),
      profile
        ? prisma.offer.count({
            where: {
              influencerId: user.id,
              status: { notIn: ["COMPLETED", "CANCELLED", "REJECTED"] },
            },
          })
        : Promise.resolve(0),
      profile
        ? prisma.offer.count({
            where: { influencerId: user.id, status: "PENDING" },
          })
        : Promise.resolve(0),
      profile
        ? prisma.influencerPortfolioItem.count({
            where: { influencerProfileId: profile.id },
          })
        : Promise.resolve(0),
    ]);

  const receivedOffers =
    profile
      ? await prisma.offer.findMany({
          where: { influencerId: user.id, initiatedBy: "BRAND" },
          orderBy: { createdAt: "desc" },
          select: {
            ...offerDashboardSelect,
            brand: {
              select: {
                id: true,
                name: true,
                brand: { select: { companyName: true } },
              },
            },
          },
        })
      : [];

  const sentOffersToBrands =
    profile
      ? await prisma.offer.findMany({
          where: { influencerId: user.id, initiatedBy: "INFLUENCER" },
          orderBy: { createdAt: "desc" },
          select: {
            ...offerDashboardSelect,
            brand: {
              select: {
                id: true,
                name: true,
                brand: { select: { companyName: true } },
              },
            },
          },
        })
      : [];

  const collabOffersForReputation = [...receivedOffers, ...sentOffersToBrands];
  const completedBrandIds = [
    ...new Set(
      collabOffersForReputation.filter((o) => o.status === "COMPLETED").map((o) => o.brandId),
    ),
  ];
  const rateeReputationByUserId = await getRateeReputationByUserIds(completedBrandIds);

  const brandResults =
    profile && hasBrandSearch
      ? await prisma.brandProfile.findMany({
          where: { city },
          select: {
            id: true,
            userId: true,
            companyName: true,
            profileImageUrl: true,
            city: true,
          },
          take: 30,
          orderBy: { companyName: "asc" },
        })
      : [];

  const portfolioItems =
    profile
      ? await prisma.influencerPortfolioItem.findMany({
          where: { influencerProfileId: profile.id },
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, url: true, platform: true },
          take: 20,
        })
      : [];

  return (
    <div className="dashboard-page">
      <header className="dashboard-page__header">
        <div className="dashboard-page__header-main">
          <h1 className="dashboard-page__title">Influencer Paneli</h1>
          <p className="dashboard-page__welcome muted">Hoş geldin, {user.name}</p>
          <div className="dashboard-page__stats" aria-label="Özet">
            <div className="brand-stat-chip">
              <span className="brand-stat-chip__value">{pipelineOfferCount}</span>
              <span className="brand-stat-chip__label">Aktif iş birliği</span>
            </div>
            <div className="brand-stat-chip">
              <span className="brand-stat-chip__value">{pendingOfferCount}</span>
              <span className="brand-stat-chip__label">Bekleyen teklif</span>
            </div>
            <div className="brand-stat-chip">
              <span className="brand-stat-chip__value">{socialLinkedCount}</span>
              <span className="brand-stat-chip__label">Bağlı sosyal hesap</span>
            </div>
            <div className="brand-stat-chip">
              <span className="brand-stat-chip__value">{portfolioItemCount}</span>
              <span className="brand-stat-chip__label">Portföy öğesi</span>
            </div>
          </div>
        </div>
        <form className="dashboard-page__logout" action="/api/auth/logout" method="post">
          <button className="btn secondary" type="submit">
            Çıkış
          </button>
        </form>
      </header>

      <section className="dash-card dash-card--section">
        <h2 className="dash-section__title">Profil</h2>
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

      {profile && (
        <section className="dash-card dash-card--section profile-preview-cta" aria-labelledby="profile-preview-heading">
          <h2 id="profile-preview-heading" className="dash-section__title">
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
      )}

      <SocialAccountsSection />

      {profile && (
        <section className="dash-card dash-card--section dash-card--emphasis" id="influencer-marka-ara">
          <h2 className="dash-section__title">Marka ara</h2>
          <p className="dash-section__lede muted">
            Şehre göre kayıtlı markaları bulun ve iş birliği teklifi gönderin.
          </p>
          <form className="influencer-search-form" method="get" action="/influencer">
            <div className="influencer-search-form__city">
              <CitySelect id="brand-city" name="city" defaultValue={city} required={false} />
            </div>
            <div className="influencer-search-form__actions">
              <button className="btn" type="submit">
                Ara
              </button>
              <a className="btn secondary" href="/influencer">
                Filtreyi temizle
              </a>
            </div>
          </form>

          {!hasBrandSearch ? (
            <EmptyStateCard
              icon="🏢"
              title="Marka listesi için arama yapın"
              description="Şehir seçerek kayıtlı markaları listeleyebilir ve iş birliği isteği gönderebilirsiniz."
            />
          ) : brandResults.length === 0 ? (
            <EmptyStateCard
              icon="📍"
              title="Bu şehirde marka bulunamadı"
              description="Farklı bir şehir deneyebilir veya filtreyi temizleyebilirsiniz."
            />
          ) : (
            <div className="influencer-results-stack brand-results-stack">
              {brandResults.map((b) => (
                <article key={b.id} className="brand-result-card">
                  <div className="brand-result-card__head">
                    <img
                      className="brand-result-card__avatar"
                      src={b.profileImageUrl ?? getAvatarUrl(b.userId)}
                      alt=""
                    />
                    <div className="brand-result-card__identity">
                      <p className="brand-result-card__name">{b.companyName}</p>
                      <p className="muted brand-result-card__city">{b.city ?? "—"}</p>
                    </div>
                    <a className="btn secondary btn--sm" href={`/profil/marka/${b.userId}`}>
                      Profili incele
                    </a>
                  </div>

                  <form className="brand-result-card__form" action="/api/offers/create" method="post">
                    <input type="hidden" name="brandId" value={b.userId} />
                    <label htmlFor={`title-${b.id}`}>Kampanya başlığı</label>
                    <input id={`title-${b.id}`} name="title" type="text" required />
                    <label htmlFor={`brief-${b.id}`}>Kısa açıklama</label>
                    <textarea id={`brief-${b.id}`} name="brief" required rows={3} />
                    <label htmlFor={`amt-${b.id}`}>İş birliği bütçesi (TRY)</label>
                    <input
                      id={`amt-${b.id}`}
                      name="offerAmountTRY"
                      type="number"
                      required
                      min={100}
                      step={100}
                      defaultValue={
                        profile.basePriceTRY > 0
                          ? Math.max(100, Math.ceil(profile.basePriceTRY / 100) * 100)
                          : 100
                      }
                    />
                    <button className="btn" type="submit">
                      Markaya iş birliği isteği gönder
                    </button>
                  </form>
                </article>
              ))}
            </div>
          )}
        </section>
      )}

      {profile && (
        <section className="dash-card dash-card--section">
          <h2 className="dash-section__title">Markalardan gelen iş birliği istekleri</h2>
          {receivedOffers.length === 0 ? (
            <EmptyStateCard
              icon="📨"
              title="Henüz gelen istek yok"
              description="Markalardan iş birliği teklifi geldiğinde burada listelenir."
            >
              <Link className="btn secondary" href="#influencer-marka-ara">
                Marka ara
              </Link>
            </EmptyStateCard>
          ) : (
            <div className="dash-collab-list">
              {receivedOffers.map((o) => (
                <CollaborationCard
                  key={o.id}
                  offer={toCollaborationCardOffer(o)}
                  otherSideLabel="Marka"
                  otherSideName={o.brand?.brand?.companyName ?? o.brand?.name ?? "-"}
                  profileHref={o.brand?.id ? `/profil/marka/${o.brand.id}` : null}
                  chatHref={o.conversation?.id ? `/chat/${o.conversation.id}` : null}
                  counterpartyRating={rateeReputationByUserId.get(o.brandId) ?? null}
                  availableNextTransitions={getAvailableOfferTransitions({
                    offer: {
                      id: o.id,
                      status: o.status,
                      brandId: o.brandId,
                      influencerId: o.influencerId,
                      initiatedBy: o.initiatedBy,
                    },
                    sessionUser,
                  })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {profile && (
        <section className="dash-card dash-card--section">
          <h2 className="dash-section__title">Markaya gönderdiğin iş birliği istekleri</h2>
          {sentOffersToBrands.length === 0 ? (
            <EmptyStateCard
              icon="📤"
              title="Henüz gönderdiğiniz istek yok"
              description="Uygun markaları bularak kendi teklifinizi gönderebilirsiniz."
            >
              <Link className="btn secondary" href="#influencer-marka-ara">
                Marka ara
              </Link>
            </EmptyStateCard>
          ) : (
            <div className="dash-collab-list">
              {sentOffersToBrands.map((o) => (
                <CollaborationCard
                  key={o.id}
                  offer={toCollaborationCardOffer(o)}
                  otherSideLabel="Marka"
                  otherSideName={o.brand?.brand?.companyName ?? o.brand?.name ?? "-"}
                  profileHref={o.brand?.id ? `/profil/marka/${o.brand.id}` : null}
                  chatHref={o.conversation?.id ? `/chat/${o.conversation.id}` : null}
                  counterpartyRating={rateeReputationByUserId.get(o.brandId) ?? null}
                  availableNextTransitions={getAvailableOfferTransitions({
                    offer: {
                      id: o.id,
                      status: o.status,
                      brandId: o.brandId,
                      influencerId: o.influencerId,
                      initiatedBy: o.initiatedBy,
                    },
                    sessionUser,
                  })}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {profile && (
        <section className="dash-card dash-card--section dash-card--portfolio">
          <h2 className="dash-section__title">Portföy</h2>
          <p className="dash-section__lede muted">
            En iyi içerik örneklerinizi ekleyin; markalar profilinizde bunları görür.
          </p>
          <InfluencerPortfolioManager initialItems={portfolioItems} />
        </section>
      )}
    </div>
  );
}
