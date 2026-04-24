/**
 * Hero CTA yakınında kompakt güven özeti (tam kartların yerine geçmez).
 */
export function PublicProfileHeroTrustChips({
  averageRating,
  ratingCount,
  completedCollaborationsCount,
}: {
  averageRating: number | null;
  ratingCount: number;
  completedCollaborationsCount: number;
}) {
  const hasRating = averageRating != null && ratingCount > 0;
  const hasCollab = completedCollaborationsCount > 0;
  const emptyBoth = !hasRating && !hasCollab;

  if (emptyBoth) {
    return (
      <div className="public-profile-hero-trust-chips" aria-label="Profil güven özeti">
        <p className="public-profile-hero-trust-chips__line">
          <span className="public-profile-hero-trust-chips__pill public-profile-hero-trust-chips__pill--neutral">
            Yeni profil
          </span>
          <span className="public-profile-hero-trust-chips__sep" aria-hidden>
            ·
          </span>
          <span className="public-profile-hero-trust-chips__soft">Henüz puanlama yok</span>
          <span className="public-profile-hero-trust-chips__sep" aria-hidden>
            ·
          </span>
          <span className="public-profile-hero-trust-chips__soft">Henüz iş birliği yok</span>
        </p>
      </div>
    );
  }

  return (
    <div className="public-profile-hero-trust-chips" aria-label="Profil güven özeti">
      <p className="public-profile-hero-trust-chips__line">
        {hasRating ? (
          <>
            <span className="public-profile-hero-trust-chips__pill">★ {averageRating!.toFixed(1)}</span>
            <span className="public-profile-hero-trust-chips__meta">
              ({ratingCount.toLocaleString("tr-TR")} puanlama)
            </span>
          </>
        ) : (
          <span className="public-profile-hero-trust-chips__soft">Henüz puanlama yok</span>
        )}
        <span className="public-profile-hero-trust-chips__sep" aria-hidden>
          ·
        </span>
        {hasCollab ? (
          <span className="public-profile-hero-trust-chips__pill public-profile-hero-trust-chips__pill--success">
            {completedCollaborationsCount.toLocaleString("tr-TR")} tamamlanan iş birliği
          </span>
        ) : (
          <span className="public-profile-hero-trust-chips__soft">Henüz iş birliği yok</span>
        )}
      </p>
    </div>
  );
}
