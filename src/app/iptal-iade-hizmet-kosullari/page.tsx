import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "İptal, İade ve Hizmet Koşulları",
  description:
    "InfluSepet iptal ve hizmet koşulları; iş birliği süreçleri ve ödeme entegrasyonu öncesi döneme uygun çerçeve.",
};

export default function IptalIadeHizmetKosullariPage() {
  return (
    <LegalPageShell title="İptal, İade ve Hizmet Koşulları">
      <p className="legal-updated">Son güncelleme: Mart 2026</p>

      <p>
        Bu metin, <strong>InfluSepet</strong> platformu üzerinden yürütülen hizmetler ve kullanıcılar arasındaki
        iş birlikleri bakımından <strong>iptal, fesih ve ücretlendirme</strong> konularına ilişkin genel bir çerçeve
        sunar. Taraflar arasındaki somut hak ve yükümlülükler, karşılıklı mutabakat, teklif içeriği ve yürürlükteki
        hukuka göre şekillenir.
      </p>

      <h2>Ödeme entegrasyonu hakkında açık bilgi</h2>
      <p>
        <strong>
          Platform üzerinde, üçüncü taraf ödeme kuruluşu entegrasyonu ile canlı ödeme tahsilatı (örneğin kredi kartı
          ile anında ödeme) bu metnin yayımlandığı dönemde kullanıma sunulmuş olmayabilir.
        </strong>{" "}
        Ödeme ve iade süreçleri ileride bir ödeme altyapısı ile entegre edildiğinde, işlem koşulları ayrıca
        duyurulacak ve gerekiyorsa bu sayfa ile diğer sözleşme metinleri güncellenecektir. Şu aşamada
        kullanıcıların Platform üzerinden otomatik bir ödeme/iade akışına tabi olduğu iddia edilmemelidir.
      </p>

      <h2>İş birliği ve tekliflerin durumu</h2>
      <p>
        Tekliflerin oluşturulması, kabulü, reddi veya iptali; Platform’un sunduğu iş akışı ve tarafların
        karşılıklı beyanlarına bağlıdır. Bir iş birliğinin hangi aşamada ve hangi koşullarda sona ereceği, ilgili
        teklifin içeriği ve tarafların anlaşmasına göre değişebilir.
      </p>

      <h2>İptal ve vazgeçme</h2>
      <ul>
        <li>
          Taraflardan biri, yürürlükteki hukuka ve Platform kurallarına uygun şekilde iş birliğinden veya teklif
          sürecinden cayma veya iptal talebinde bulunabilir; bunun sonuçları (örneğin içerik kullanımı, teslim
          edilmiş çalışmalar) ilgili mutabakata ve mevzuata tabidir.
        </li>
        <li>
          Platform, kötüye kullanım veya ihlal tespiti halinde iş birliği veya hesap düzeyinde işlem yapma
          hakkını saklı tutar.
        </li>
      </ul>

      <h2>Ücret, komisyon ve iade (genel)</h2>
      <p>
        Gelecekte ücretlendirme, komisyon veya ödeme aracılığı söz konusu olduğunda, ücret tabloları, kesintiler
        ve iade şartları ayrıca belirlenecek ve kullanıcılar öncesinde bilgilendirilecektir. Bu metin, henüz
        yürürlüğe girmemiş bir ödeme sistemine ilişkin somut iade vadeti içermez.
      </p>

      <h2>Hizmetin değiştirilmesi veya durdurulması</h2>
      <p>
        Şirket, teknik, hukuki veya operasyonel gerekçelerle Platform özelliklerini güncelleyebilir, geçici veya
        kalıcı olarak kısmen durdurabilir. Mümkün olduğunca önceden bilgilendirme hedeflenir; acil güvenlik veya
        yasal zorunluluk hallerinde bu süre kısalabilir.
      </p>

      <h2>İletişim</h2>
      <p>
        Bu konularda sorularınız için: <a href="mailto:destek@influsepet.com">destek@influsepet.com</a> — adres ve
        şirket bilgileri: <a href="/iletisim">İletişim</a>.
      </p>
    </LegalPageShell>
  );
}
