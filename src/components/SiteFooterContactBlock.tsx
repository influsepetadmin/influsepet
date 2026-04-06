const SUPPORT_EMAIL = "destek@influsepet.com";
const COMPANY_PHONE_DISPLAY = "(0344) 415 13 14";
const COMPANY_PHONE_TEL = "+9034444151314";

/**
 * Adres / iletişim satırı — yalnızca giriş (/giris) auth sayfasında kullanılır; global footer’da yok.
 */
export function SiteFooterContactBlock() {
  return (
    <div className="site-footer-meta">
      <p className="site-footer-company-name">
        AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI
      </p>
      <p className="site-footer-address muted">YUNUS EMRE MAH. ASLI SK. NO: 7 BA ELBISTAN/ KAHRAMANMARAS</p>
      <div className="site-footer-contact">
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        <a href={`tel:${COMPANY_PHONE_TEL}`}>{COMPANY_PHONE_DISPLAY}</a>
      </div>
    </div>
  );
}
