import Image from "next/image";

export function AuthShowcaseAside() {
  return (
    <aside className="auth-showcase">
      <div className="auth-showcase-logo">
        <Image
          src="/branding/logo-primary.png"
          alt=""
          width={168}
          height={168}
          priority
          sizes="168px"
          className="auth-showcase-logo-img"
        />
      </div>
      <h1 className="auth-showcase-title">InfluSepet</h1>
      <p className="auth-showcase-lead">
        Influencer’lar ve markaları güvenli, düzenli iş birlikleri için bir araya getirir. Tekliften teslimata tek
        panel.
      </p>
      <ul className="auth-benefits">
        <li>Teklif ve sohbet aynı yerde</li>
        <li>Doğrulanabilir sosyal hesap bağlantıları</li>
        <li>Teslim ve değerlendirme ile net kapanış</li>
      </ul>
    </aside>
  );
}
