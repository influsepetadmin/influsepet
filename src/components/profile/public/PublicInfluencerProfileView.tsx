import type { ReactNode } from "react";
import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { PublicProfileHeader } from "./PublicProfileHeader";
import { PublicProfileHomeLink } from "./PublicProfileHomeLink";
import { PublicProfileStats } from "./PublicProfileStats";
import { VerifiedSocialAccounts } from "./VerifiedSocialAccounts";

/**
 * Herkese açık `/u/[username]` ve marka paneli `/profil/influencer/[userId]` için tek düzen:
 * aynı hero, istatistikler, puan özeti, kategoriler, bio, doğrulanmış sosyal blokları.
 */
export function PublicInfluencerProfileView({
  data,
  homeHref,
  homeLinkLabel,
  headerCta,
}: {
  data: PublicProfileByUsernameResponse;
  homeHref: string;
  homeLinkLabel?: string;
  /** Örn. marka: herkese açık profil linki; `/u` için verilmez (varsayılan “yakında” CTA). */
  headerCta?: ReactNode;
}) {
  return (
    <div className="public-profile-page public-profile-page--influencer">
      <div className="public-profile-page__inner public-profile-page__inner--influencer">
        <div className="public-profile-shell public-profile-shell--influencer">
          <PublicProfileHomeLink href={homeHref} label={homeLinkLabel} />
          <PublicProfileHeader data={data} cta={headerCta} />
          <PublicProfileStats data={data} />
          <VerifiedSocialAccounts accounts={data.verifiedSocialAccounts} />
        </div>
      </div>
    </div>
  );
}
