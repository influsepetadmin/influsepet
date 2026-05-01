import CitySelect from "@/components/CitySelect";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import ProfileImageField from "@/components/ProfileImageField";

export default function InfluencerProfileForm({
  initial,
  isExistingProfile,
}: {
  initial: {
    username: string;
    followerCount: number;
    basePriceTRY: number;
    city: string;
    profileImageUrl: string;
    selectedCategoryKeys: string[];
    nicheText: string;
    instagramUrl: string;
    tiktokUrl: string;
  };
  isExistingProfile: boolean;
}) {
  return (
    <form action="/api/profile/influencer" method="post" className="influencer-profile-form">
      <section className="influencer-profile-form__section" aria-labelledby="influencer-profile-basic-heading">
        <header className="influencer-profile-form__section-head">
          <span className="influencer-profile-form__eyebrow">Profil</span>
          <h3 id="influencer-profile-basic-heading" className="influencer-profile-form__title">
            Temel bilgiler
          </h3>
        </header>

        <div className="influencer-profile-form__grid">
          <div className="influencer-profile-form__field">
            <label htmlFor="username">Kullanici adi</label>
            <input id="username" name="username" type="text" required defaultValue={initial.username} />
          </div>

          <div className="influencer-profile-form__field">
            <label htmlFor="followerCount">Takipci sayisi</label>
            <input
              id="followerCount"
              name="followerCount"
              type="number"
              min={0}
              required
              defaultValue={initial.followerCount}
            />
          </div>

          <div className="influencer-profile-form__field">
            <label htmlFor="basePriceTRY">Base fiyat (TRY)</label>
            <input
              id="basePriceTRY"
              name="basePriceTRY"
              type="number"
              min={0}
              required
              defaultValue={initial.basePriceTRY}
            />
          </div>

          <div className="influencer-profile-form__field">
            <label htmlFor="city">Sehir</label>
            <CitySelect id="city" name="city" defaultValue={initial.city} />
          </div>
        </div>
      </section>

      <section className="influencer-profile-form__section" aria-labelledby="influencer-profile-category-heading">
        <header className="influencer-profile-form__section-head">
          <span className="influencer-profile-form__eyebrow">Keşif</span>
          <h3 id="influencer-profile-category-heading" className="influencer-profile-form__title">
            Kategoriler ve niş alanı
          </h3>
        </header>

        <div className="influencer-profile-form__field influencer-profile-form__categories">
          <label>Kategoriler</label>
          <CategoryMultiSelect initialSelected={initial.selectedCategoryKeys} />
        </div>

        <div className="influencer-profile-form__field">
          <label htmlFor="nicheText" className="influencer-form-niche-label">
            Diğer / Niş alan (opsiyonel)
          </label>
          <textarea
            id="nicheText"
            name="nicheText"
            rows={2}
            maxLength={500}
            placeholder="Örn: kahve içerikleri, kamp-karavan, minimal yaşam"
            defaultValue={initial.nicheText}
            style={{ maxWidth: "100%", fontSize: "0.95rem" }}
          />
        </div>
      </section>

      <section
        className="influencer-profile-form__section influencer-profile-form__section--image"
        aria-labelledby="influencer-profile-image-heading"
      >
        <header className="influencer-profile-form__section-head">
          <span className="influencer-profile-form__eyebrow">Görsel</span>
          <h3 id="influencer-profile-image-heading" className="influencer-profile-form__title">
            Profil resmi
          </h3>
        </header>

        <div className="influencer-profile-form__image-field">
          <ProfileImageField initialUrl={initial.profileImageUrl} inputId="profileImageUrl" />
        </div>
      </section>

      <section className="influencer-profile-form__section" aria-labelledby="influencer-profile-social-heading">
        <header className="influencer-profile-form__section-head">
          <span className="influencer-profile-form__eyebrow">Bağlantılar</span>
          <h3 id="influencer-profile-social-heading" className="influencer-profile-form__title">
            Sosyal bağlantılar
          </h3>
          <p className="influencer-profile-form__hint muted">
            Güven ve doğrulama için öncelikle paneldeki <strong>Sosyal Hesaplar</strong> bölümünden hesap bağlayıp
            doğrulamanız önerilir. Aşağıdaki alanlar geçici olarak serbest metin bağlantıları içindir.
          </p>
        </header>

        <div className="influencer-profile-form__grid">
          <div className="influencer-profile-form__field">
            <label htmlFor="instagramUrl">Instagram URL (opsiyonel)</label>
            <input
              id="instagramUrl"
              name="instagramUrl"
              type="text"
              inputMode="url"
              autoComplete="url"
              defaultValue={initial.instagramUrl}
            />
          </div>

          <div className="influencer-profile-form__field">
            <label htmlFor="tiktokUrl">TikTok URL (opsiyonel)</label>
            <input
              id="tiktokUrl"
              name="tiktokUrl"
              type="text"
              inputMode="url"
              autoComplete="url"
              defaultValue={initial.tiktokUrl}
            />
          </div>
        </div>
      </section>

      <div className="influencer-profile-form__actions">
        <button className="btn" type="submit">
          {isExistingProfile ? "Profili guncelle" : "Profili kaydet"}
        </button>
      </div>
    </form>
  );
}
