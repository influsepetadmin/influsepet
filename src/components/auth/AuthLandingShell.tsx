import Image from "next/image";
import {
  UnifiedAuthEntry,
  type AuthLandingBasePath,
  type AuthMode,
  type AuthRole,
} from "@/components/auth/UnifiedAuthEntry";

type Props = {
  initialRole: AuthRole;
  initialMode: AuthMode;
  initialErr: string | null;
  basePath: AuthLandingBasePath;
};

export function AuthLandingShell({ initialRole, initialMode, initialErr, basePath }: Props) {
  return (
    <div className="auth-landing-wrap">
      <section className="auth-shell">
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
            Influencer’lar ve markaları güvenli, düzenli iş birlikleri için bir araya getirir. Tekliften teslimata
            tek panel.
          </p>
          <ul className="auth-benefits">
            <li>Teklif ve sohbet aynı yerde</li>
            <li>Doğrulanabilir sosyal hesap bağlantıları</li>
            <li>Teslim ve değerlendirme ile net kapanış</li>
          </ul>
        </aside>

        <UnifiedAuthEntry
          key={`${initialRole}-${initialMode}-${initialErr ?? ""}`}
          initialRole={initialRole}
          initialMode={initialMode}
          initialErr={initialErr}
          basePath={basePath}
        />
      </section>
    </div>
  );
}
