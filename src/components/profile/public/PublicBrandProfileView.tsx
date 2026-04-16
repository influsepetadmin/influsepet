import type { ReactNode } from "react";
import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { PublicBrandProfileHeader } from "./PublicBrandProfileHeader";
import { PublicBrandProfileStats } from "./PublicBrandProfileStats";
import { PublicProfileHomeLink } from "./PublicProfileHomeLink";
import { VerifiedSocialAccounts } from "./VerifiedSocialAccounts";

/**
 * Herkese açık `/brand/[username]` ve dahili `/profil/marka/[userId]` için tek düzen:
 * aynı hero, istatistikler, doğrulanmış sosyal.
 */
export function PublicBrandProfileView({
  data,
  homeHref,
  homeLinkLabel,
  headerCta,
}: {
  data: PublicBrandProfileResponse;
  homeHref: string;
  homeLinkLabel?: string;
  /** Dahili profil: herkese açık URL; herkese açık sayfa: verilmez (varsayılan “yakında” CTA). */
  headerCta?: ReactNode;
}) {
  return (
    <div className="public-profile-page public-profile-page--brand">
      <div className="public-profile-page__inner public-profile-page__inner--brand">
        <div className="public-profile-shell public-profile-shell--brand">
          <PublicProfileHomeLink href={homeHref} label={homeLinkLabel} />
          <PublicBrandProfileHeader data={data} cta={headerCta} />
          <div className="public-profile-brand-secondary">
            <PublicBrandProfileStats data={data} />
            <VerifiedSocialAccounts accounts={data.verifiedSocialAccounts} />
          </div>
        </div>
      </div>
    </div>
  );
}
