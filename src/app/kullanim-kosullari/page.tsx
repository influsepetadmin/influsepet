import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Kullanım Koşulları",
  description:
    "InfluSepet platform kullanım koşulları: hesap sorumluluğu, iş birliği kuralları, içerik ve güvenlik.",
};

export default function KullanimKosullariPage() {
  return (
    <LegalPageShell title="Kullanım Koşulları">
      <p className="legal-updated">Son güncelleme: Mart 2026</p>

      <p>
        Bu Kullanım Koşulları (“<strong>Koşullar</strong>”), <strong>InfluSepet</strong> platformuna (
        <strong>“Platform”</strong>) erişen ve kullanan gerçek veya tüzel kişi kullanıcılar (“
        <strong>Kullanıcı</strong>”) ile <strong>AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI</strong>
        (“<strong>Şirket</strong>”) arasındaki ilişkiyi düzenler. Platformu kullanmaya devam etmeniz, bu Koşulları
        okuduğunuz ve bağlı olduğunuz anlamına gelir.
      </p>

      <h2>Hizmetin niteliği</h2>
      <p>
        InfluSepet; markalar ile influencer’ları buluşturmayı, teklif ve iş birliği süreçlerini dijital ortamda
        yönetmeyi ve iletişimi kolaylaştırmayı amaçlar. Platform, taraflar arasındaki ticari veya içerik üretim
        ilişkisinin tarafı değildir; sözleşme ilişkisi doğrudan kullanıcılar arasında kurulur. Şirket, tarafların
        karşılıklı yükümlülüklerinin yerine getirilmesini garanti etmez.
      </p>

      <h2>Hesap ve doğruluk</h2>
      <ul>
        <li>Kayıt sırasında ve profil güncellemelerinde doğru ve güncel bilgi vermekle yükümlüsünüz.</li>
        <li>Hesap güvenliğinden (şifre vb.) siz sorumlusunuz; hesabınız üzerinden yapılan işlemler size izafe edilir.</li>
        <li>Başkasının hesabını izinsiz kullanamazsınız.</li>
      </ul>

      <h2>Yasal ve platforma uygun kullanım</h2>
      <p>
        Platformu; yürürlükteki mevzuata, üçüncü kişi haklarına ve bu Koşullara aykırı şekilde kullanamazsınız.
        Örneğin hakaret, tehdit, yanıltıcı içerik, spam, zararlı yazılım yayımı, başkalarının kişisel verilerini
        hukuka aykırı işleme yasaktır.
      </p>

      <h2>Sosyal hesap doğrulama</h2>
      <p>
        Sosyal hesap bağlama ve doğrulama özellikleri, Platform tarafından sunulan yöntemlerle sınırlıdır.
        Doğrulama sonucu, ilgili platformun veya üçüncü tarafların kurallarına tabi olabilir. Doğrulama
        “onayı”, üçüncü taraflar nezdinde ek bir taahhüt oluşturmaz.
      </p>

      <h2>İş birliği, teklif ve iletişim</h2>
      <ul>
        <li>Teklifler, ücretler, teslim tarihleri ve içerik kapsamı taraflarca netleştirilmelidir.</li>
        <li>Sohbet ve dosya paylaşımı iş birliği kapsamında yapılmalıdır; hukuka aykırı veya zararlı içerik yasaktır.</li>
        <li>Taraflar, fikri mülkiyet, reklam ve yayın hakları ile ilgili yükümlülükleri kendi aralarında ve
          yürürlükteki hukuka uygun şekilde düzenlemekle yükümlüdür.</li>
      </ul>

      <h2>İçerik ve sorumluluk sınırları</h2>
      <p>
        Kullanıcıların paylaştığı metin, görüntü ve diğer içeriklerden içerik sahibi kullanıcılar sorumludur.
        Şirket, kullanıcı içeriklerini önceden denetlemekle yükümlü değildir; ancak ihbar veya tespit halinde
        içeriği kaldırma veya erişimi sınırlama hakkını saklı tutar.
      </p>

      <h2>Müdahale ve hesap kapatma</h2>
      <p>
        Koşullara aykırılık, dolandırıcılık şühesi veya güvenlik gerekçesiyle hesapları askıya alma, kısıtlama veya
        sonlandırma; içerikleri kaldırma ve yasal mercilere bildirim yapma hakları saklıdır.
      </p>

      <h2>Garanti reddi</h2>
      <p>
        Platform “olduğu gibi” sunulur. Kesintisiz veya hatasız çalışacağı, belirli bir sonuç sağlayacağı veya
        tüm risklerin ortadan kalkacağına dair zımni veya açık bir garanti verilmez.
      </p>

      <h2>Değişiklikler</h2>
      <p>
        Koşullar güncellenebilir. Önemli değişikliklerde kullanıcıların bilgilendirilmesi hedeflenir. Güncel metin
        bu sayfada yayımlanır.
      </p>

      <h2>Uygulanacak hukuk ve uyuşmazlık</h2>
      <p>
        Uyuşmazlıklarda Türkiye Cumhuriyeti hukuku uygulanır. Yetkili mahkeme ve icra daireleri bakımından
        yürürlükteki kanunlar uygulanır.
      </p>

      <h2>İletişim</h2>
      <p>
        <a href="/iletisim">İletişim</a> bilgileri ve <a href="mailto:destek@influsepet.com">destek@influsepet.com</a>
      </p>
    </LegalPageShell>
  );
}
