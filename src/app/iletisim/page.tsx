import type { Metadata } from "next";
import { LegalPageShell } from "@/components/legal/LegalPageShell";

export const metadata: Metadata = {
  title: "İletişim",
  description:
    "InfluSepet iletişim bilgileri: şirket unvanı, adres, vergi numarası ve destek e-postası.",
};

export default function IletisimPage() {
  return (
    <LegalPageShell title="İletişim">
      <p className="legal-updated">Son güncelleme: Mart 2026</p>

      <h2>Platform</h2>
      <p>
        <strong>InfluSepet</strong> hizmetleri, aşağıda bilgileri yer alan şirket tarafından sunulmaktadır.
        Teknik destek, hesap ve genel başvurular için öncelikle e-posta kanalını kullanmanızı rica ederiz.
      </p>

      <h2>Şirket bilgileri</h2>
      <p>
        <strong>Ticaret unvanı:</strong>
        <br />
        AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI
      </p>
      <p>
        <strong>Adres:</strong>
        <br />
        YUNUS EMRE MAH. ASLI SK. NO: 7 BA ELBISTAN/ KAHRAMANMARAS
      </p>
      <p>
        <strong>Şehir / bölge:</strong> Kahramanmaraş
      </p>
      <p>
        <strong>Vergi kimlik numarası:</strong> 0160817394
      </p>

      <h2>Destek ve başvuru</h2>
      <p>
        Kullanım ile ilgili sorularınız, hesap talepleri ve diğer başvurular için:{" "}
        <a href="mailto:destek@influsepet.com">destek@influsepet.com</a>
      </p>
      <p>
        E-posta gönderirken mümkün olduğunca kayıtlı e-posta adresinizi ve talebinizi net şekilde özetlemeniz,
        yanıt süresini kısaltmaya yardımcı olur. KVKK kapsamındaki hak talepleriniz için de aynı kanalı
        kullanabilirsiniz; konu satırında &quot;KVKK başvurusu&quot; ibaresini belirtmeniz önerilir.
      </p>

      <h2>Not</h2>
      <p>
        Platform üzerinden yürütülen iş birlikleri, tarafların karşılıklı taahhütleri ve platform kuralları ile
        şekillenir. Hukuki içerikler için <a href="/kullanim-kosullari">Kullanım Koşulları</a> ve ilgili diğer
        sayfalarımıza başvurunuz.
      </p>
    </LegalPageShell>
  );
}
