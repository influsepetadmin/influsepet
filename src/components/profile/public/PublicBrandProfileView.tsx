import type { ReactNode } from "react";
import type { PublicBrandProfileResponse } from "@/lib/publicProfile/publicBrandProfileByUsername";
import { PublicBrandProfileHeader } from "./PublicBrandProfileHeader";
import { PublicBrandProfileStats } from "./PublicBrandProfileStats";
import { PublicProfileAsideBrand } from "./PublicProfileAsideBrand";
import { PublicProfileCollaborationTrust } from "./PublicProfileCollaborationTrust";
import { PublicProfileHomeLink } from "./PublicProfileHomeLink";
import { PublicProfileRatingSummary } from "./PublicProfileRatingSummary";
import { PublicRecentReviewsSection } from "./PublicRecentReviewsSection";
import { VerifiedSocialAccounts } from "./VerifiedSocialAccounts";

/**
 * Herkese açık `/brand/[username]` ve dahili `/profil/marka/[userId]` için tek düzen.
 */
export function PublicBrandProfileView({
  data,
  homeHref,
  homeLinkLabel,
  headerCta,
  appShell,
  isOwnPublicProfile,
  chatHref,
  viewerRole,
}: {
  data: PublicBrandProfileResponse;
  homeHref: string;
  homeLinkLabel?: string;
  /** Dahili profil: herkese açık URL; herkese açık sayfa: verilmez (varsayılan “yakında” CTA). */
  headerCta?: ReactNode;
  /** `/profil/...` önizlemesi: logged-in shell + indigo primary (herkese açık `/brand` mavi kalır). */
  appShell?: boolean;
  /** Oturumdaki marka kendi herkese açık profilini mi görüyor (kendine teklif CTA’sı gizlenir). */
  isOwnPublicProfile: boolean;
  chatHref?: string | null;
  viewerRole?: "INFLUENCER" | "BRAND" | null;
}) {
  return (
    <div
      className={`public-profile-page public-profile-page--brand${appShell ? " public-profile-page--app" : ""}`}
    >
      <div className="public-profile-page__inner public-profile-page__inner--brand public-profile-page__inner--wide">
        <div className="public-profile-shell public-profile-shell--brand public-profile-shell--split">
          <PublicProfileHomeLink href={homeHref} label={homeLinkLabel} />
          <div className="public-profile-split">
            <div className="public-profile-split__main">
              <PublicBrandProfileHeader
                data={data}
                cta={headerCta}
                isOwnPublicProfile={isOwnPublicProfile}
                chatHref={chatHref}
                viewerRole={viewerRole}
              />
              <PublicBrandProfileStats data={data} />
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
              <PublicProfileAsideBrand data={data} />
              <VerifiedSocialAccounts accounts={data.verifiedSocialAccounts} />
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
}
