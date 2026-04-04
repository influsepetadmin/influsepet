import Image from "next/image";
import Link from "next/link";

const LEGAL_LINKS = [
  { href: "/hakkimizda", label: "Hakkımızda" },
  { href: "/iletisim", label: "İletişim" },
  { href: "/gizlilik-politikasi", label: "Gizlilik Politikası" },
  { href: "/kvkk-aydinlatma-metni", label: "KVKK Aydınlatma Metni" },
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
  { href: "/iptal-iade-hizmet-kosullari", label: "İptal, İade ve Hizmet Koşulları" },
] as const;

const SUPPORT_EMAIL = "destek@influsepet.com";
const COMPANY_PHONE_DISPLAY = "(0344) 415 13 14";
const COMPANY_PHONE_TEL = "+9034444151314";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-main">
          <div className="site-footer-brand-block">
            <Link href="/" className="site-footer-brand">
              <Image
                src="/branding/logo-primary.png"
                alt=""
                width={44}
                height={44}
                sizes="44px"
                className="site-footer-brand-icon"
              />
              <span className="site-footer-brand-name">InfluSepet</span>
            </Link>
            <p className="site-footer-tagline muted">
              Markalar ile içerik üreticilerini düzenli iş birlikleri için buluşturan dijital platform.
            </p>
          </div>

          <nav className="site-footer-nav" aria-label="Yasal ve kurumsal">
            <p className="site-footer-nav-heading">Yasal ve bilgi</p>
            <ul>
              {LEGAL_LINKS.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-footer-meta">
            <p className="site-footer-company-name">
              AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI
            </p>
            <p className="site-footer-address muted">
              YUNUS EMRE MAH. ASLI SK. NO: 7 BA ELBISTAN/ KAHRAMANMARAS
            </p>
            <div className="site-footer-contact">
              <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
              <a href={`tel:${COMPANY_PHONE_TEL}`}>{COMPANY_PHONE_DISPLAY}</a>
            </div>
          </div>
        </div>
      </div>
      <p className="site-footer-copy muted">© {new Date().getFullYear()} InfluSepet. Tüm hakları saklıdır.</p>
    </footer>
  );
}
