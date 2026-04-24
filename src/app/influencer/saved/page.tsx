import Link from "next/link";
import { Bookmark } from "lucide-react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { MarketplaceBrandOfferCard } from "@/components/marketplace/MarketplaceBrandOfferCard";
import { getCategoryLabel } from "@/lib/categories";
import { getInfluencerPanelAccess } from "@/lib/influencer/panelAccess";
import { prisma } from "@/lib/prisma";

export default async function InfluencerSavedPage() {
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
  const basePriceTRY = profile?.basePriceTRY ?? 0;

  const rows = await prisma.influencerSavedBrand.findMany({
    where: { influencerUserId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      brandUser: {
        include: {
          brand: {
            include: { selectedCategories: { select: { categoryKey: true } } },
          },
        },
      },
    },
  });

  const count = rows.length;

  return (
    <div className="dashboard-page influencer-panel-page influencer-saved">
      <PageHeader
        title="Kayıtlı markalar"
        description={
          count > 0
            ? `${count} marka kayıtlı listenizde. İstediğiniz zaman tekrar keşfedebilir veya kaydı kaldırabilirsiniz.`
            : "İlginizi çeken markaları kaydedin; teklif öncesi hızlıca geri dönün."
        }
        action={
          <Link className="btn secondary" href="/influencer/discover">
            Keşfet
          </Link>
        }
      />

      {count === 0 ? (
        <section className="dash-card dash-card--section">
          <EmptyStateCard
            icon={<Bookmark strokeWidth={1.25} />}
            hint="Teklif öncesi kısayol"
            title="Kayıtlı marka yok"
            description="Keşfet’te kartlardan “Kaydet” ile listeyi oluşturun; teklif yazmadan önce buradan açın."
          >
            <Link className="btn" href="/influencer/discover#influencer-marka-ara">
              Keşfede marka bul
            </Link>
          </EmptyStateCard>
        </section>
      ) : (
        <section className="dash-card dash-card--section dash-card--emphasis">
          <p className="saved-page__count muted" aria-live="polite">
            Toplam <strong>{count}</strong> kayıt
          </p>
          <div className="marketplace-discover__grid marketplace-discover__grid--brands saved-page__grid">
            {rows.map((row) => {
              const b = row.brandUser.brand;
              if (!b) return null;
              const cats = b.selectedCategories.map((c) => getCategoryLabel(c.categoryKey)).join(", ");
              const defaultAmt =
                basePriceTRY > 0 ? Math.max(100, Math.ceil(basePriceTRY / 100) * 100) : 100;
              return (
                <MarketplaceBrandOfferCard
                  key={row.id}
                  formIdKey={row.id}
                  brandUserId={b.userId}
                  companyName={b.companyName}
                  city={b.city}
                  profileImageUrl={b.profileImageUrl}
                  categoriesLine={cats}
                  whyLine="Kayıtlı listenizde"
                  initialSaved={true}
                  defaultOfferAmountTRY={defaultAmt}
                  cardClassName="brand-result-card brand-result-card--discover brand-result-card--hub"
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
