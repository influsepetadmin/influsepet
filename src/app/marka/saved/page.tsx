import Link from "next/link";
import { Bookmark } from "lucide-react";
import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { ForbiddenStateCard } from "@/components/feedback/ForbiddenStateCard";
import { PageHeader } from "@/components/app-shell/PageHeader";
import { DiscoverySaveButton } from "@/components/marketplace/DiscoverySaveButton";
import { getAvatarUrl } from "@/lib/avatar";
import { getCategoryLabel } from "@/lib/categories";
import { truncateText } from "@/lib/dashboardProfileCompletion";
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
                <article
                  key={row.id}
                  className="influencer-result-card influencer-result-card--discover influencer-result-card--hub"
                >
                  <div className="influencer-result-card__head influencer-result-card__head--hub">
                    <img
                      className="influencer-result-card__avatar"
                      src={p.profileImageUrl ?? getAvatarUrl(p.userId)}
                      alt=""
                    />
                    <div className="influencer-result-card__identity">
                      <p className="influencer-result-card__name">{p.username}</p>
                      <p className="muted influencer-result-card__city">{p.city ?? "—"}</p>
                      <p className="muted influencer-result-card__meta">{categories || "—"}</p>
                      <p className="muted influencer-result-card__why">Kayıtlı listenizde</p>
                    </div>
                    <div className="influencer-result-card__actions">
                      <DiscoverySaveButton
                        targetUserId={p.userId}
                        variant="brand-saves-influencer"
                        initialSaved
                      />
                      <Link className="btn secondary btn--sm" href={`/profil/influencer/${p.userId}`}>
                        Profil
                      </Link>
                    </div>
                  </div>
                  <p className="muted influencer-result-card__meta influencer-result-card__stats">
                    Takipçi: {p.followerCount.toLocaleString("tr-TR")} · Baz fiyat: {p.basePriceTRY} TRY
                  </p>
                  {p.nicheText?.trim() ? (
                    <p className="muted influencer-result-card__niche">
                      Niş: {truncateText(p.nicheText.trim(), 72)}
                    </p>
                  ) : null}

                  <form className="influencer-result-card__form" action="/api/offers/create" method="post">
                    <input type="hidden" name="influencerId" value={p.userId} />
                    <label htmlFor={`saved-inf-title-${row.id}`}>Kampanya başlığı</label>
                    <input id={`saved-inf-title-${row.id}`} name="title" type="text" required />
                    <label htmlFor={`saved-inf-brief-${row.id}`}>Kısa açıklama</label>
                    <textarea id={`saved-inf-brief-${row.id}`} name="brief" required rows={2} />
                    <label htmlFor={`saved-inf-amt-${row.id}`}>İş birliği bütçesi (TRY)</label>
                    <input
                      id={`saved-inf-amt-${row.id}`}
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
