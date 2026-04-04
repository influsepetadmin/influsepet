import CitySelect from "@/components/CitySelect";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import ProfileImageField from "@/components/ProfileImageField";
import { getAvatarUrl } from "@/lib/avatar";

export default function InfluencerProfileForm({
  initial,
  isExistingProfile,
  userId,
}: {
  userId: string;
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
    <form action="/api/profile/influencer" method="post">
      <label htmlFor="username">Kullanici adi</label>
      <input id="username" name="username" type="text" required defaultValue={initial.username} />

      <label htmlFor="followerCount">Takipci sayisi</label>
      <input
        id="followerCount"
        name="followerCount"
        type="number"
        min={0}
        required
        defaultValue={initial.followerCount}
      />

      <label htmlFor="basePriceTRY">Base fiyat (TRY)</label>
      <input
        id="basePriceTRY"
        name="basePriceTRY"
        type="number"
        min={0}
        required
        defaultValue={initial.basePriceTRY}
      />

      <label htmlFor="city">Sehir</label>
      <CitySelect id="city" name="city" defaultValue={initial.city} />

      <label>Kategoriler</label>
      <CategoryMultiSelect initialSelected={initial.selectedCategoryKeys} />

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

      <ProfileImageField
        initialUrl={initial.profileImageUrl}
        fallbackPreviewUrl={getAvatarUrl(userId)}
        inputId="profileImageUrl"
      />

      <p className="muted" style={{ marginTop: 12, marginBottom: 6, fontSize: "0.88rem" }}>
        Güven ve doğrulama için öncelikle paneldeki <strong>Sosyal Hesaplar</strong> bölümünden hesap bağlayıp
        doğrulamanız önerilir. Aşağıdaki alanlar geçici olarak serbest metin bağlantıları içindir.
      </p>

      <label htmlFor="instagramUrl">Instagram URL (opsiyonel)</label>
      <input id="instagramUrl" name="instagramUrl" type="url" defaultValue={initial.instagramUrl} />

      <label htmlFor="tiktokUrl">TikTok URL (opsiyonel)</label>
      <input id="tiktokUrl" name="tiktokUrl" type="url" defaultValue={initial.tiktokUrl} />

      <div style={{ marginTop: 12 }}>
        <button className="btn" type="submit">
          {isExistingProfile ? "Profili guncelle" : "Profili kaydet"}
        </button>
      </div>
    </form>
  );
}
