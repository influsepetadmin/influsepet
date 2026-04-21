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
  appShell,
  isOwnPublicProfile,
}: {
  data: PublicProfileByUsernameResponse;
  homeHref: string;
  homeLinkLabel?: string;
  /** Örn. marka paneli: herkese açık profil linki + ipucu. */
  headerCta?: ReactNode;
  /** `/profil/...` önizlemesi: logged-in shell + indigo primary (herkese açık `/u` mavi kalır). */
  appShell?: boolean;
  /** Oturumdaki influencer kendi herkese açık profilini mi görüyor. */
  isOwnPublicProfile: boolean;
}) {
  return (
    <div
      className={`public-profile-page public-profile-page--influencer${appShell ? " public-profile-page--app" : ""}`}
    >
      <div className="public-profile-page__inner public-profile-page__inner--influencer">
        <div className="public-profile-shell public-profile-shell--influencer">
          <PublicProfileHomeLink href={homeHref} label={homeLinkLabel} />
          <PublicProfileHeader data={data} cta={headerCta} isOwnPublicProfile={isOwnPublicProfile} />
          <PublicProfileStats data={data} />
          <VerifiedSocialAccounts accounts={data.verifiedSocialAccounts} />
        </div>
      </div>
    </div>
  );
}
