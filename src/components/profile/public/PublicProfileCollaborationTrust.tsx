/** Tamamlanan iş birliği sayısı — ek API alanı olmadan hafif güven metni. */
export function PublicProfileCollaborationTrust({ completedCount }: { completedCount: number }) {
  return (
    <section
      className="public-profile-trust-collab"
      aria-labelledby="public-profile-trust-collab-heading"
    >
      <h2 id="public-profile-trust-collab-heading" className="public-profile-trust-collab__title">
        Platform geçmişi
      </h2>
      <p className="public-profile-trust-collab__body">
        {completedCount > 0 ? (
          <>
            Bu profil InfluSepet üzerinden{" "}
            <strong>{completedCount.toLocaleString("tr-TR")}</strong> tamamlanan iş birliği
            kaydına sahip.
          </>
        ) : (
          <>
            Henüz tamamlanan herkese açık iş birliği kaydı yok; teklifler tamamlandıkça geçmiş ve
            değerlendirmeler burada birikir.
          </>
        )}
      </p>
    </section>
  );
}
