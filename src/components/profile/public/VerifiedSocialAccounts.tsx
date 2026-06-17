import type { SocialAccountVerificationStatus, SocialPlatform } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { Camera, Music2, SquarePlay } from "lucide-react";
import { platformLabel } from "@/components/social/SocialAccountCard";
import { SocialVerificationBadge } from "@/components/social/SocialVerificationBadge";

export type PublicVerifiedSocialAccount = {
  platform: SocialPlatform;
  username: string;
  profileUrl: string | null;
  isVerified?: boolean;
  verificationStatus?: SocialAccountVerificationStatus;
  verifiedAt: string | null;
};

function platformGlyph(platform: SocialPlatform): LucideIcon {
  switch (platform) {
    case "INSTAGRAM":
      return Camera;
    case "TIKTOK":
      return Music2;
    case "YOUTUBE":
      return SquarePlay;
    default:
      return Camera;
  }
}

function isPublicVerified(account: PublicVerifiedSocialAccount): boolean {
  const status = account.verificationStatus ?? "VERIFIED";
  return Boolean(account.isVerified ?? account.verifiedAt) && status === "VERIFIED";
}

export function VerifiedSocialAccounts({
  accounts,
  title = "Doğrulanmış hesaplar",
}: {
  accounts: PublicVerifiedSocialAccount[];
  title?: string;
}) {
  if (accounts.length === 0) return null;

  return (
    <section
      className="public-profile-section public-profile-section--social"
      aria-labelledby="public-profile-social-heading"
    >
      <h2 id="public-profile-social-heading" className="public-profile-section__title">
        {title}
      </h2>
      <ul className="public-profile-social-list">
        {accounts.map((a) => {
          const PlatformGlyph = platformGlyph(a.platform);
          const showVerifiedBadge = isPublicVerified(a);
          return (
            <li key={`${a.platform}-${a.username}`} className="public-profile-social-card">
              <div className="public-profile-social-card__header">
                <span
                  className={`public-profile-social-card__glyph public-profile-social-card__glyph--${a.platform.toLowerCase()}`}
                  aria-hidden
                >
                  <PlatformGlyph size={19} strokeWidth={2.05} />
                </span>
                <div className="public-profile-social-card__head-text">
                  <span className="public-profile-social-card__platform">{platformLabel(a.platform)}</span>
                  {showVerifiedBadge ? (
                    <SocialVerificationBadge status="VERIFIED" mode="public" />
                  ) : null}
                </div>
              </div>
              <p className="public-profile-social-card__handle">@{a.username}</p>
              {a.profileUrl ? (
                <a
                  className="public-profile-social-card__link"
                  href={a.profileUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Profili aç
                </a>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
