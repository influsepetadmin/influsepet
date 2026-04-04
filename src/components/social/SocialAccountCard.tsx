import type { SocialPlatform, VerificationMethod } from "@prisma/client";

export type SocialAccountCardData = {
  id: string;
  platform: SocialPlatform;
  username: string;
  profileUrl: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  followerCount: number | null;
  isConnected: boolean;
  isVerified: boolean;
  verificationMethod: VerificationMethod | null;
  verifiedAt: string | null;
};

export function platformLabel(p: SocialPlatform): string {
  switch (p) {
    case "INSTAGRAM":
      return "Instagram";
    case "TIKTOK":
      return "TikTok";
    case "YOUTUBE":
      return "YouTube";
    default:
      return p;
  }
}

function platformClass(p: SocialPlatform): string {
  switch (p) {
    case "INSTAGRAM":
      return "social-account-card--instagram";
    case "TIKTOK":
      return "social-account-card--tiktok";
    case "YOUTUBE":
      return "social-account-card--youtube";
    default:
      return "social-account-card--default";
  }
}

function methodLabel(m: VerificationMethod | null): string | null {
  if (!m) return null;
  switch (m) {
    case "OAUTH":
      return "OAuth";
    case "BIO_CODE":
      return "Bio kodu";
    case "MANUAL":
      return "Manuel";
    default:
      return m;
  }
}

function methodChipClass(m: VerificationMethod | null): string {
  if (!m) return "social-chip social-chip--method";
  switch (m) {
    case "OAUTH":
      return "social-chip social-chip--method social-chip--method-oauth";
    case "BIO_CODE":
      return "social-chip social-chip--method social-chip--method-bio";
    case "MANUAL":
      return "social-chip social-chip--method social-chip--method-manual";
    default:
      return "social-chip social-chip--method";
  }
}

export function SocialAccountCard({ account }: { account: SocialAccountCardData }) {
  const verifiedDate =
    account.verifiedAt != null
      ? new Date(account.verifiedAt).toLocaleString("tr-TR", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : null;

  const method = methodLabel(account.verificationMethod);

  return (
    <article className={`social-account-card ${platformClass(account.platform)}`}>
      <div className="social-account-card__head">
        <div className="social-account-card__platform">
          <span className="social-account-card__platform-label">{platformLabel(account.platform)}</span>
        </div>
        <div className="social-account-card__chips" aria-label="Hesap durumu">
          <span
            className={`social-chip ${account.isConnected ? "social-chip--connected" : "social-chip--disconnected"}`}
          >
            {account.isConnected ? "Bağlı" : "Bağlı değil"}
          </span>
          <span
            className={`social-chip ${account.isVerified ? "social-chip--verified" : "social-chip--pending"}`}
          >
            {account.isVerified ? "Doğrulandı" : "Doğrulama bekliyor"}
          </span>
        </div>
      </div>

      <p className="social-account-card__username">@{account.username}</p>

      {account.profileUrl ? (
        <p className="social-account-card__meta">
          <a href={account.profileUrl} target="_blank" rel="noreferrer">
            Profil bağlantısı
          </a>
        </p>
      ) : null}

      {account.isVerified && method ? (
        <p className="social-account-card__meta social-account-card__meta--row">
          <span className="social-account-card__meta-key">Doğrulama yöntemi</span>
          <span className={methodChipClass(account.verificationMethod)}>{method}</span>
        </p>
      ) : null}

      {account.isVerified && verifiedDate ? (
        <p className="social-account-card__meta muted social-account-card__meta--small">
          Doğrulama zamanı: {verifiedDate}
        </p>
      ) : null}

      {(account.displayName || account.followerCount != null || account.avatarUrl) && (
        <div className="social-account-card__extra">
          {account.avatarUrl ? (
            <img className="social-account-card__avatar" src={account.avatarUrl} alt="" />
          ) : null}
          <div className="social-account-card__extra-text">
            {account.displayName ? (
              <p className="social-account-card__display-name muted">{account.displayName}</p>
            ) : null}
            {account.followerCount != null ? (
              <p className="muted social-account-card__followers">
                Takipçi (senk.): {account.followerCount.toLocaleString("tr-TR")}
              </p>
            ) : null}
          </div>
        </div>
      )}
    </article>
  );
}
