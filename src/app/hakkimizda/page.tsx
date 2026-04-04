import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Hakkımızda",
  description:
    "InfluSepet nedir? Markalar ve influencer’lar için iş birliği platformu, süreçler ve güven odaklı yaklaşımımız hakkında bilgi.",
};

export default function HakkimizdaPage() {
  return (
    <LegalPageShell title="Hakkımızda">
      <p className="legal-updated">Son güncelleme: Mart 2026</p>

      <h2>InfluSepet nedir?</h2>
      <p>
        <strong>InfluSepet</strong>, markalar ile içerik üreticilerini (influencer’ları) dijital ortamda bir araya
        getiren, iş birliği süreçlerini düzenli ve izlenebilir kılmayı hedefleyen bir platformdur. Platform
        üzerinden taraflar; teklif oluşturma ve yönetimi, iş birliği kapsamında sohbet, teslimat ve değerlendirme
        adımlarını aynı ekosistem içinde yürütebilir.
      </p>

      <h2>Kimler için?</h2>
      <p>
        <strong>Markalar</strong> için kampanya ve iş birliği ihtiyaçlarını netleştirme, uygun içerik
        üreticileriyle iletişim kurma ve süreci panel üzerinden takip etme imkânı sunulur.{" "}
        <strong>Influencer’lar</strong> için ise profil oluşturma, markalarla teklif üzerinden buluşma ve iş
        birliği ilerleyişini tek yerden yönetme hedeflenir.
      </p>

      <h2>Temel iş akışı</h2>
      <ul>
        <li>Hesap oluşturma ve rol seçimi (marka veya influencer)</li>
        <li>Profil bilgilerinin girilmesi; influencer tarafında kategori ve fiyat gibi alanların doldurulması</li>
        <li>Teklif oluşturma veya gelen tekliflere yanıt verme</li>
        <li>Kabul edilen iş birlikleri için sohbet kanalı üzerinden iletişim</li>
        <li>Gerektiğinde teslimat bilgisi paylaşımı ve sürece uygun değerlendirme adımları</li>
        <li>İsteğe bağlı sosyal hesap bağlantısı ve doğrulama süreçleri (platform kuralları çerçevesinde)</li>
        <li>İş birliği kapsamında metin ve medya paylaşımı (örneğin görüntü ve video dosyaları; teknik üst sınırlar ve kurallar uygulanır)</li>
      </ul>

      <h2>Güven ve şeffaflık</h2>
      <p>
        InfluSepet, taraflar arasında iletişimi kolaylaştırmayı ve süreçleri mümkün olduğunca şeffaf tutmayı
        amaçlar. Kullanıcıların hesap bilgilerini doğru tutması, iş birliği koşullarını karşılıklı netleştirmesi
        ve platform kurallarına uyması beklenir. Detaylı hukuki bilgilere{" "}
        <a href="/gizlilik-politikasi">Gizlilik Politikası</a>, <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a> ve{" "}
        <a href="/kullanim-kosullari">Kullanım Koşulları</a> üzerinden ulaşabilirsiniz.
      </p>

      <h2>İletişim</h2>
      <p>
        Sorularınız için <a href="mailto:destek@influsepet.com">destek@influsepet.com</a> adresinden bize
        ulaşabilirsiniz. Şirket ve adres bilgileri için <a href="/iletisim">İletişim</a> sayfasına bakınız.
      </p>
    </LegalPageShell>
  );
}
