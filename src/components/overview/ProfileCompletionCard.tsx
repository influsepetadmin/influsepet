import Link from "next/link";
import { ArrowRight, Check, Circle } from "lucide-react";
import type { ProfileCompletionResult, ProfileCompletionSection } from "@/lib/dashboardProfileCompletion";

type Props = {
  completion: ProfileCompletionResult;
  profileHref: string;
  businessHref?: string;
};

function sectionHref(profileHref: string, businessHref: string | undefined, section: ProfileCompletionSection): string {
  if (section === "social") return `${profileHref}?tab=sosyal`;
  if (section === "portfolio") return `${profileHref}?tab=portfoy`;
  if (section === "business") return businessHref ?? profileHref;
  return `${profileHref}?tab=genel`;
}

export function ProfileCompletionCard({ completion, profileHref, businessHref }: Props) {
  if (completion.isComplete) {
    return (
      <section className="ov-profile-completion ov-profile-completion--complete">
        <span className="ov-profile-completion__complete-icon" aria-hidden>
          <Check size={17} strokeWidth={2.2} />
        </span>
        <div className="ov-profile-completion__complete-copy">
          <p className="ov-profile-completion__complete-title">Profil %100 tamamlandı</p>
          <p className="ov-profile-completion__complete-body">
            Profiliniz keşfet ve public sayfanız için hazır görünüyor.
          </p>
        </div>
        <Link className="ov-profile-completion__complete-link" href={profileHref}>
          Profili yönet
          <ArrowRight size={14} strokeWidth={2} aria-hidden />
        </Link>
      </section>
    );
  }

  const visibleItems = completion.items.filter((item) => !item.completed).slice(0, 3);
  const status = `${completion.remainingCount} adım kaldı.`;

  return (
    <section className={`ov-profile-completion${completion.isComplete ? " ov-profile-completion--complete" : ""}`}>
      <div className="ov-profile-completion__main">
        <div className="ov-profile-completion__heading-row">
          <div>
            <p className="ov-profile-completion__eyebrow">Profil tamamlama</p>
            <p className="ov-profile-completion__status">{status}</p>
          </div>
          <strong className="ov-profile-completion__percent">{completion.percent}%</strong>
        </div>

        <div
          className="ov-profile-completion__track"
          role="progressbar"
          aria-label="Profil tamamlama"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={completion.percent}
        >
          <span className="ov-profile-completion__fill" style={{ width: `${completion.percent}%` }} />
        </div>

        <div className="ov-profile-completion__steps" aria-label="Profil tamamlama adımları">
          {visibleItems.map((item) => (
            <Link
              className="ov-profile-completion__step"
              href={sectionHref(profileHref, businessHref, item.section)}
              key={item.key}
            >
              <Circle size={13} strokeWidth={2} aria-hidden />
              {item.label}
            </Link>
          ))}
        </div>
      </div>

      <Link
        className="btn btn--sm ov-profile-completion__cta"
        href={sectionHref(profileHref, businessHref, visibleItems[0]?.section ?? "general")}
      >
        Eksikleri tamamla
        <ArrowRight size={15} strokeWidth={2} aria-hidden />
      </Link>
    </section>
  );
}
