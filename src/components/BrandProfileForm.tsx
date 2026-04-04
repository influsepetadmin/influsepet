import CitySelect from "@/components/CitySelect";
import CategoryMultiSelect from "@/components/CategoryMultiSelect";
import ProfileImageField from "@/components/ProfileImageField";
import { getAvatarUrl } from "@/lib/avatar";

export default function BrandProfileForm({
  initial,
  isExistingProfile,
  userId,
}: {
  userId: string;
  initial: {
    companyName: string;
    city: string;
    website: string;
    profileImageUrl: string;
    username: string;
    bio: string;
    selectedCategoryKeys: string[];
  };
  isExistingProfile: boolean;
}) {
  return (
    <form action="/api/profile/brand" method="post">
      <label htmlFor="companyName">Sirket / Marka adi</label>
      <input id="companyName" name="companyName" type="text" required defaultValue={initial.companyName} />

      <label htmlFor="username">Herkese acik kullanici adi (opsiyonel)</label>
      <input
        id="username"
        name="username"
        type="text"
        autoComplete="off"
        placeholder="ornek_marka"
        defaultValue={initial.username}
      />
      <p className="muted" style={{ fontSize: "0.85rem", marginTop: 4 }}>
        Kucuk harf, rakam ve alt cizgi. Profil: /brand/kullanici-adi
      </p>

      <label htmlFor="bio">Kisa tanitim (opsiyonel)</label>
      <textarea
        id="bio"
        name="bio"
        rows={3}
        maxLength={2000}
        placeholder="Markanizi kisaca anlatin"
        defaultValue={initial.bio}
      />

      <label htmlFor="city">Sehir</label>
      <CitySelect id="city" name="city" defaultValue={initial.city} />

      <label htmlFor="website">Web sitesi (opsiyonel)</label>
      <input id="website" name="website" type="url" defaultValue={initial.website} />

      <p style={{ marginTop: 12, marginBottom: 6 }}>Sektor / kategori (en fazla 3)</p>
      <CategoryMultiSelect initialSelected={initial.selectedCategoryKeys} inputName="brandCategoryKeys" />

      <ProfileImageField
        initialUrl={initial.profileImageUrl}
        fallbackPreviewUrl={getAvatarUrl(userId)}
        inputId="profileImageUrl"
      />

      <div style={{ marginTop: 12 }}>
        <button className="btn" type="submit">
          {isExistingProfile ? "Profili guncelle" : "Profil olustur"}
        </button>
      </div>
    </form>
  );
}
