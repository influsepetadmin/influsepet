import Link from "next/link";
import { Bookmark } from "lucide-react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { MarketplaceInfluencerOfferCard } from "@/components/marketplace/MarketplaceInfluencerOfferCard";
import { getCategoryLabel } from "@/lib/categories";
import { getMarkaPanelAccess } from "@/lib/marka/panelAccess";
import { prisma } from "@/lib/prisma";

export default async function MarkaSavedPage() {
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

  const rows = profile
    ? await prisma.brandSavedInfluencer.findMany({
        where: { brandUserId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
          influencerUser: {
            include: {
              influencer: {
                include: { selectedCategories: { select: { categoryKey: true } } },
              },
            },
          },
        },
      })
    : [];

  const count = rows.length;

  return (
    <div className="dashboard-page influencer-panel-page marka-saved">
      <PageHeader
        title="Kayıtlı içerik üreticileri"
        description={
          count > 0
            ? `${count} profil kayıtlı listenizde. Teklif öncesi hızlıca göz atın veya kaydı kaldırın.`
            : "Uygun içerik üreticilerini kaydedin; teklif aşamasına geldiğinizde listeye dönün."
        }
        action={
          <Link className="btn secondary" href="/marka/discover">
            Keşfet
          </Link>
        }
      />

      {!profile ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<Bookmark strokeWidth={1.25} />}
            title="Marka profili gerekli"
            description="Kayıtlı listeyi kullanmak için önce marka profilinizi tamamlayın."
          >
            <Link className="btn" href="/marka/profile?tab=genel">
              Profile git
            </Link>
          </EmptyStateCard>
        </section>
      ) : count === 0 ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<Bookmark strokeWidth={1.25} />}
            title="Henüz kayıtlı profil yok"
            description="Keşfet’te veya arama sonuçlarında beğendiğiniz içerik üreticilerinin kartındaki “Kaydet” ile buraya ekleyin."
          >
            <Link className="btn" href="/marka/discover">
              İçerik üreticisi keşfet
            </Link>
          </EmptyStateCard>
        </section>
      ) : (
        <section className="dash-card dash-card--section dash-card--emphasis">
          <p className="saved-page__count muted" aria-live="polite">
            Toplam <strong>{count}</strong> kayıt
          </p>
          <div className="marketplace-discover__grid discover-hub__grid saved-page__grid">
            {rows.map((row) => {
              const p = row.influencerUser.influencer;
              if (!p) return null;
              const categories = p.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
              const defaultAmt =
                p.basePriceTRY > 0 ? Math.max(100, Math.ceil(p.basePriceTRY / 100) * 100) : 100;
              return (
                <MarketplaceInfluencerOfferCard
                  key={row.id}
                  formIdKey={row.id}
                  influencerUserId={p.userId}
                  username={p.username}
                  city={p.city}
                  profileImageUrl={p.profileImageUrl}
                  categoriesLine={categories}
                  whyLine="Kayıtlı listenizde"
                  followerCount={p.followerCount}
                  basePriceTRY={p.basePriceTRY}
                  nicheText={p.nicheText}
                  nicheTruncateLen={72}
                  initialSaved={true}
                  defaultOfferAmountTRY={defaultAmt}
                  cardClassName="influencer-result-card influencer-result-card--discover influencer-result-card--hub"
                  profileLinkLabel="Profil"
                  submitButtonLabel="İş birliği isteği gönder"
                  briefRows={2}
                />
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
