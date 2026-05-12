const SUPPORT_EMAIL = "destek@influsepet.com";
const COMPANY_PHONE_DISPLAY = "(0344) 415 13 14";
const COMPANY_PHONE_TEL = "+9034444151314";
const COMPANY_ADDRESS = "Yunus Emre Mah. Aslı Sk. No: 7 BA Elbistan / Kahramanmaraş";
const COMPANY_NAME = "AKBIR KIRTASIYE GIDA MATBAACILIK SANAYI TICARET ANONIM SIRKETI";

/**
 * Adres / iletişim satırı — yalnızca giriş (/giris) auth sayfasında kullanılır; global footer’da yok.
 */
export function SiteFooterContactBlock() {
  return (
    <div className="auth-login-contact-card" aria-label="InfluSepet iletişim bilgileri">
      <div className="auth-login-contact-card__brand">
        <p className="auth-login-contact-card__name">InfluSepet</p>
        <p className="auth-login-contact-card__tagline muted">
          Markalar ve içerik üreticileri için iş birliği platformu.
        </p>
      </div>
      <dl className="auth-login-contact-card__list">
        <div>
          <dt>Destek</dt>
          <dd>
            <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </dd>
        </div>
        <div>
          <dt>Telefon</dt>
          <dd>
            <a href={`tel:${COMPANY_PHONE_TEL}`}>{COMPANY_PHONE_DISPLAY}</a>
          </dd>
        </div>
        <div>
          <dt>Adres</dt>
          <dd>{COMPANY_ADDRESS}</dd>
        </div>
        <div>
          <dt>Şirket</dt>
          <dd>{COMPANY_NAME}</dd>
        </div>
      </dl>
    </div>
  );
}
