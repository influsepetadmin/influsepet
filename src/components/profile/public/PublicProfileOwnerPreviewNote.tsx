/** Kendi herkese açık profil önizlemesi — iş birliği CTA yerine. */
export function PublicProfileOwnerPreviewNote() {
  return (
    <div className="public-profile-owner-preview" role="status">
      <p className="public-profile-owner-preview__title">Bu profil markalara böyle görünüyor</p>
      <p className="public-profile-owner-preview__desc muted">
        Kendi herkese açık profil görünümünü inceliyorsun. Markalar profilini bu şekilde görür.
      </p>
    </div>
  );
}
