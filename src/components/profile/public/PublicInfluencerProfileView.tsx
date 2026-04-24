import type { ReactNode } from "react";
import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";
import { PublicProfileAsideInfluencer } from "./PublicProfileAsideInfluencer";
import { PublicProfileCollaborationTrust } from "./PublicProfileCollaborationTrust";
import { PublicProfileHeader } from "./PublicProfileHeader";
import { PublicProfileHomeLink } from "./PublicProfileHomeLink";
import { PublicProfileRatingSummary } from "./PublicProfileRatingSummary";
import { PublicProfileStats } from "./PublicProfileStats";
import { PublicRecentReviewsSection } from "./PublicRecentReviewsSection";
import { VerifiedSocialAccounts } from "./VerifiedSocialAccounts";

/**
 * Herkese açık `/u/[username]` ve marka paneli `/profil/influencer/[userId]` için tek düzen:
 * hero + iki sütun (güven / istatistik sol; kategori, bio, sosyaller sağ).
 */
export function PublicInfluencerProfileView({
  data,
  homeHref,
  homeLinkLabel,
  headerCta,
  appShell,
  isOwnPublicProfile,
  chatHref,
  canSendCollaborationRequest = true,
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
  chatHref?: string | null;
  /** Marka oturumu yoksa giriş CTA’sı gösterilir. */
  canSendCollaborationRequest?: boolean;
}) {
  return (
    <div
      className={`public-profile-page public-profile-page--influencer${appShell ? " public-profile-page--app" : ""}`}
    >
      <div className="public-profile-page__inner public-profile-page__inner--influencer public-profile-page__inner--wide">
        <div className="public-profile-shell public-profile-shell--influencer public-profile-shell--split">
          <PublicProfileHomeLink href={homeHref} label={homeLinkLabel} />
          <div className="public-profile-split">
            <div className="public-profile-split__main">
              <PublicProfileHeader
                data={data}
                cta={headerCta}
                isOwnPublicProfile={isOwnPublicProfile}
                chatHref={chatHref}
                canSendCollaborationRequest={canSendCollaborationRequest}
              />
              <PublicProfileStats data={data} />
              <div className="public-profile-trust-stack">
                <PublicProfileCollaborationTrust completedCount={data.completedCollaborationsCount} />
                <PublicProfileRatingSummary
                  averageRating={data.averageRating}
                  ratingCount={data.ratingCount}
                />
                <PublicRecentReviewsSection reviews={data.recentPublicReviews} compact />
              </div>
            </div>
            <aside className="public-profile-split__aside">
              <PublicProfileAsideInfluencer data={data} />
              <VerifiedSocialAccounts accounts={data.verifiedSocialAccounts} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
