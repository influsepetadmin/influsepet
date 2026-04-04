import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "Gizlilik Politikası",
  description:
    "InfluSepet Gizlilik Politikası: kişisel verilerin işlenmesi, çerez ve oturum, iletişim ve güvenlik konularına ilişkin açıklamalar.",
};

export default function GizlilikPolitikasiPage() {
  return (
    <LegalPageShell title="Gizlilik Politikası">
      <p className="legal-updated">Son güncelleme: Mart 2026</p>

      <p>
        Bu Gizlilik Politikası, <strong>InfluSepet</strong> platformunu kullanırken,{" "}
        <strong>AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI</strong> (“
        <strong>Şirket</strong>”) tarafından hangi tür bilgilerin işlenebileceğine ve bunların hangi amaçlarla
        kullanılabileceğine dair genel bir çerçeve sunar. Detaylı KVKK aydınlatması için{" "}
        <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a>’ni inceleyiniz.
      </p>

      <h2>Toplanabilecek veri türleri (özet)</h2>
      <p>Platformun işleyişi gereği aşağıdaki kategorilerde veriler işlenebilir:</p>
      <ul>
        <li>
          <strong>Hesap ve kimlik:</strong> ad-soyad veya firma temsilcisi bilgisi, e-posta adresi, şifre (teknik
          olarak güvenli biçimde saklanan özet/hash), kullanıcı rolü (ör. marka veya influencer).
        </li>
        <li>
          <strong>Profil ve iş birliği içeriği:</strong> şirket adı, şehir, kategori, fiyat ve benzeri profil
          alanları; teklif metinleri ve iş birliği sürecinde girilen içerikler.
        </li>
        <li>
          <strong>İletişim ve sohbet:</strong> iş birliği kapsamında platform üzerinden gönderilen mesajlar ve
          paylaşılan dosyalara ilişkin teknik kayıtlar (içerik ve meta veriler).
        </li>
        <li>
          <strong>Sosyal hesap doğrulama:</strong> bağlanan platform ve kullanıcı adı gibi bilgiler; doğrulama
          yöntemine bağlı olarak işlenen ek teknik veriler.
        </li>
        <li>
          <strong>Teknik ve güvenlik:</strong> oturum çerezleri veya benzeri teknolojiler ile oturum yönetimi;
          sunucu ve uygulama günlükleri (ör. IP adresi, tarayıcı/istemci bilgisi, zaman damgası, hata kayıtları).
        </li>
      </ul>

      <h2>Kullanım amaçları</h2>
      <ul>
        <li>Hesap oluşturma, giriş yapma ve oturumun güvenli şekilde sürdürülmesi</li>
        <li>Teklif, sohbet, teslimat ve değerlendirme süreçlerinin yürütülmesi</li>
        <li>Platform güvenliğinin sağlanması, kötüye kullanımın tespiti ve önlenmesi</li>
        <li>Yasal yükümlülüklerin yerine getirilmesi ve yetkili kurumlara bilgi verilmesi (hukuken gerekli hallerde)</li>
        <li>Destek taleplerinin yanıtlanması</li>
      </ul>

      <h2>Çerezler ve oturum</h2>
      <p>
        Oturumunuzu tanımak için tarayıcı çerezleri veya benzeri yöntemler kullanılabilir. Oturum çerezi genellikle
        yalnızca oturum süresi boyunca veya belirli bir süre için geçerlidir. Üçüncü taraf reklam çerezleri
        kullanılmadığından emin olmak için yapılandırmayı güncel tutmayı hedefleriz; mevcut uygulama
        sürümünde hangi çerezlerin aktif olduğu ürün geliştikçe bu metinde netleştirilebilir.
      </p>

      <h2>Veri saklama ve güvenlik</h2>
      <p>
        Veriler, hizmetin sunulması için gerekli süre boyunca ve yasal zorunluluklar çerçevesinde saklanır.
        Teknik ve idari tedbirlerle yetkisiz erişim, kayıp veya ifşaya karşı makul güvenlik önlemleri alınması
        hedeflenir; ancak internet ortamında hiçbir sistemin %100 risksiz olduğu garanti edilemez.
      </p>

      <h2>Üçüncü taraflar</h2>
      <p>
        Barındırma, veritabanı veya e-posta altyapısı gibi hizmet sağlayıcılarla sınırlı paylaşım gerekebilir.
        Sosyal platformlarla entegrasyon (ör. hesap doğrulama) kapsamında verilerin bir kısmı ilgili üçüncü
        tarafların politikalarına tabi olabilir.
      </p>

      <h2>Haklarınız ve iletişim</h2>
      <p>
        KVKK kapsamındaki haklarınız ve başvuru yolları için <a href="/kvkk-aydinlatma-metni">KVKK Aydınlatma Metni</a>’ne
        bakınız. Talepleriniz için: <a href="mailto:destek@influsepet.com">destek@influsepet.com</a>
      </p>

      <h2>Politika güncellemeleri</h2>
      <p>
        Bu metin, yasal düzenlemeler veya platform özellikleri değiştikçe güncellenebilir. Önemli değişikliklerde
        makul çerçevede bilgilendirme yapılması hedeflenir.
      </p>
    </LegalPageShell>
  );
}
