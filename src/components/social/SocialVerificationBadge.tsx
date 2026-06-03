import type { SocialAccountVerificationStatus } from "@prisma/client";

type SocialVerificationBadgeMode = "internal" | "public";

function statusLabel(status: SocialAccountVerificationStatus): string {
  switch (status) {
    case "PENDING":
      return "İnceleme bekliyor";
    case "VERIFIED":
      return "Doğrulandı";
    case "REJECTED":
      return "Reddedildi";
    case "EXPIRED":
      return "Süresi doldu";
    case "UNVERIFIED":
    default:
      return "Doğrulanmadı";
  }
}

export function SocialVerificationBadge({
  status,
  mode = "internal",
}: {
  status: SocialAccountVerificationStatus;
  mode?: SocialVerificationBadgeMode;
}) {
  if (mode === "public" && status !== "VERIFIED") return null;

  return (
    <span
      className={`social-verification-badge social-verification-badge--${status.toLowerCase()} social-verification-badge--${mode}`}
      title={statusLabel(status)}
    >
      <span className="social-verification-badge__mark" aria-hidden>
        ✓
      </span>
      <span className="social-verification-badge__text">{statusLabel(status)}</span>
    </span>
  );
}
