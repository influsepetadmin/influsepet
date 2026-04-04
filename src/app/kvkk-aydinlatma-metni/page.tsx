import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni",
  description:
    "6698 sayılı KVKK kapsamında InfluSepet veri sorumlusu bilgileri, işlenen veri kategorileri, amaçlar ve başvuru kanalı.",
};

export default function KvkkAydinlatmaMetniPage() {
  return (
    <LegalPageShell title="KVKK Aydınlatma Metni">
      <p className="legal-updated">Son güncelleme: Mart 2026</p>

      <p>
        6698 sayılı Kişisel Verilerin Korunması Kanunu (“<strong>KVKK</strong>”) uyarınca, kişisel verileriniz
        veri sorumlusu sıfatıyla <strong>AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI</strong>
        tarafından aşağıda açıklanan kapsamda işlenebilecektir.
      </p>

      <h2>Veri sorumlusu</h2>
      <ul>
        <li>
          <strong>Unvan:</strong> AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI
        </li>
        <li>
          <strong>Adres:</strong> YUNUS EMRE MAH. ASLI SK. NO: 7 BA ELBISTAN/ KAHRAMANMARAS
        </li>
        <li>
          <strong>İletişim / başvuru e-postası:</strong>{" "}
          <a href="mailto:destek@influsepet.com">destek@influsepet.com</a>
        </li>
      </ul>

      <h2>İşlenen kişisel veri kategorileri (özet)</h2>
      <p>Platform kullanımına bağlı olarak örneğin:</p>
      <ul>
        <li>Kimlik ve iletişim (ad, e-posta vb.)</li>
        <li>Müşteri işlem bilgisi (hesap, rol, profil ve iş birliği süreçlerine ilişkin kayıtlar)</li>
        <li>İşlem güvenliği bilgisi (oturum, teknik günlükler)</li>
        <li>Kullanıcı içeriği (teklif, mesaj, teslimat ve değerlendirme metinleri; paylaşılan medya dosyalarına ilişkin kayıtlar)</li>
        <li>Sosyal hesap doğrulama süreçlerinde işlenen bilgiler</li>
      </ul>

      <h2>İşleme amaçları</h2>
      <ul>
        <li>InfluSepet hizmetinin sunulması ve sürdürülmesi</li>
        <li>Hesap açma, kimlik doğrulama ve yetkilendirme</li>
        <li>Teklif, sözleşmesel süreç, sohbet, teslimat ve değerlendirme işlemlerinin yürütülmesi</li>
        <li>Yetkili kişi, kurum ve kuruluşlara bilgi verilmesi (yasal zorunluluk hallerinde)</li>
        <li>İş sürekliliği, bilgi güvenliği ve kötüye kullanımın önlenmesi</li>
        <li>Hukuki uyuşmazlıklarda delil oluşturulması</li>
      </ul>

      <h2>Hukuki sebep</h2>
      <p>
        Veri işleme faaliyetleri; KVKK’nın 5. ve 6. maddelerinde düzenlenen şartlardan uygun olanlara dayanır
        (örneğin kanunlarda açıkça öngörülme, bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili
        olması, meşru menfaat, açık rıza gerektiren hallerde açık rıza vb.).
      </p>

      <h2>Aktarım</h2>
      <p>
        Hizmetin gerektirdiği ölçüde; barındırma, altyapı ve benzeri iş ortaklarına aktarım yapılabilir. Yurt
        dışına aktarım söz konusuysa KVKK ve ilgili mevzuata uygunluğun sağlanması hedeflenir.
      </p>

      <h2>Saklama süresi</h2>
      <p>
        Kişisel veriler, işleme amacının gerektirdiği süre ve ilgili mevzuatta öngörülen zamanaşımı süreleri
        çerçevesinde saklanır; süre sonunda silinir, yok edilir veya anonim hale getirilir.
      </p>

      <h2>İlgili kişinin hakları</h2>
      <p>KVKK’nın 11. maddesi kapsamında haklarınız bulunmaktadır. Özetle:</p>
      <ul>
        <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
        <li>İşlenmişse buna ilişkin bilgi talep etme</li>
        <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
        <li>Yurt içinde veya yurt dışında aktarıldığı üçüncü kişileri bilme</li>
        <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
        <li>KVKK’da öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
        <li>Düzeltme, silme vb. işlemlerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
        <li>Münhasıran otomatik sistemler ile analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
        <li>Kanuna aykırı işlenmesi sebebiyle zarara uğramanız hâlinde zararın giderilmesini talep etme</li>
      </ul>

      <h2>Başvuru yöntemi</h2>
      <p>
        Haklarınıza ilişkin taleplerinizi <a href="mailto:destek@influsepet.com">destek@influsepet.com</a> adresine
        iletebilirsiniz. Başvurunuzda kimliğinizi doğrulamaya yarayacak bilgileri ve talebinizi açık şekilde
        belirtmeniz, sürecin sağlıklı yürümesine yardımcı olur. Yasal süreler çerçevesinde yanıtlanır.
      </p>
    </LegalPageShell>
  );
}
