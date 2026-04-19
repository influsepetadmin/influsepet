import Link from "next/link";
import { Bookmark } from "lucide-react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { DiscoverySaveButton } from "@/components/marketplace/DiscoverySaveButton";
import { getAvatarUrl } from "@/lib/avatar";
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
            title="Henüz kayıtlı marka yok"
            description="Keşfet’te beğendiğiniz markaların kartındaki “Kaydet” ile listeyi oluşturun. Böylece kampanya düşünürken profillere tek tıkla dönebilirsiniz."
          >
            <Link className="btn" href="/influencer/discover">
              Marka keşfet
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
                <article key={row.id} className="brand-result-card brand-result-card--discover brand-result-card--hub">
                  <div className="brand-result-card__head brand-result-card__head--hub">
                    <img
                      className="brand-result-card__avatar"
                      src={b.profileImageUrl ?? getAvatarUrl(b.userId)}
                      alt=""
                    />
                    <div className="brand-result-card__identity">
                      <p className="brand-result-card__name">{b.companyName}</p>
                      <p className="muted brand-result-card__city">{b.city ?? "—"}</p>
                      {cats ? (
                        <p className="muted brand-result-card__cats brand-result-card__meta-line">{cats}</p>
                      ) : null}
                      <p className="muted brand-result-card__why">Kayıtlı listenizde</p>
                    </div>
                    <div className="brand-result-card__actions">
                      <DiscoverySaveButton
                        targetUserId={b.userId}
                        variant="influencer-saves-brand"
                        initialSaved
                      />
                      <Link className="btn secondary btn--sm" href={`/profil/marka/${b.userId}`}>
                        Profil
                      </Link>
                    </div>
                  </div>

                  <form className="brand-result-card__form" action="/api/offers/create" method="post">
                    <input type="hidden" name="brandId" value={b.userId} />
                    <label htmlFor={`saved-brand-title-${row.id}`}>Kampanya başlığı</label>
                    <input id={`saved-brand-title-${row.id}`} name="title" type="text" required />
                    <label htmlFor={`saved-brand-brief-${row.id}`}>Kısa açıklama</label>
                    <textarea id={`saved-brand-brief-${row.id}`} name="brief" required rows={2} />
                    <label htmlFor={`saved-brand-amt-${row.id}`}>İş birliği bütçesi (TRY)</label>
                    <input
                      id={`saved-brand-amt-${row.id}`}
                      name="offerAmountTRY"
                      type="number"
                      required
                      min={100}
                      step={100}
                      defaultValue={defaultAmt}
                    />
                    <button className="btn" type="submit">
                      İş birliği isteği gönder
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
