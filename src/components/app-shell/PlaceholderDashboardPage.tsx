import { EmptyStateCard } from "@/components/feedback/EmptyStateCard";
import { EmptyGlyphInbox } from "@/components/icons/emptyStateGlyphs";
import { DashboardPlaceholderCard } from "./DashboardPlaceholderCard";
import { PageHeader } from "./PageHeader";

export function PlaceholderDashboardPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="app-shell-placeholder-page">
      <PageHeader title={title} description={description} />

      <div className="app-shell-placeholder-page__grid">
        <DashboardPlaceholderCard title="Özet">
          <p className="muted app-shell-placeholder-page__hint">
            Bu alan yakında gerçek verilerle doldurulacak. Şimdilik yer tutucu.
          </p>
          <div className="app-shell-placeholder-page__chips" aria-hidden>
            <span className="app-shell-placeholder-page__chip">Metrik</span>
            <span className="app-shell-placeholder-page__chip">Durum</span>
            <span className="app-shell-placeholder-page__chip">Son aktivite</span>
          </div>
        </DashboardPlaceholderCard>

        <DashboardPlaceholderCard title="Hızlı aksiyonlar">
          <ul className="app-shell-placeholder-page__list muted">
            <li>Tek tıkla ilgili bölüme gitme</li>
            <li>Profil tamamlama / teklif özeti</li>
          </ul>
        </DashboardPlaceholderCard>
      </div>

      <EmptyStateCard
        icon={<EmptyGlyphInbox />}
        title="Henüz kayıt yok"
        description="Bu bölüm için içerik taşındığında örnek liste ve durumlar burada görünecek."
      />
    </div>
  );
}
