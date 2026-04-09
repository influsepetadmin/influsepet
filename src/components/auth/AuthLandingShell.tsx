import {
  UnifiedAuthEntry,
  type AuthLandingBasePath,
  type AuthMode,
  type AuthRole,
} from "@/components/auth/UnifiedAuthEntry";
import { AuthShowcaseAside } from "@/components/auth/AuthShowcaseAside";
import { SiteFooterContactBlock } from "@/components/SiteFooterContactBlock";

type Props = {
  initialRole: AuthRole;
  initialMode: AuthMode;
  initialErr: string | null;
  basePath: AuthLandingBasePath;
  /** Yalnızca /giris — adres & iletişim bloğu */
  showFooterContact?: boolean;
};

export function AuthLandingShell({
  initialRole,
  initialMode,
  initialErr,
  basePath,
  showFooterContact = false,
}: Props) {
  return (
    <div className="auth-landing-wrap">
      <section className="auth-shell">
        <AuthShowcaseAside />

        <UnifiedAuthEntry
          key={`${initialRole}-${initialMode}-${initialErr ?? ""}`}
          initialRole={initialRole}
          initialMode={initialMode}
          initialErr={initialErr}
          basePath={basePath}
        />
      </section>
      {showFooterContact ? (
        <div className="auth-landing-contact">
          <SiteFooterContactBlock />
        </div>
      ) : null}
    </div>
  );
}
