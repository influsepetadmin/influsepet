import type { PortfolioPlatform } from "@prisma/client";
import type { LucideIcon } from "lucide-react";
import { Camera, ExternalLink, Link2, Music2, SquarePlay } from "lucide-react";
import type { PublicProfilePortfolioItem } from "@/lib/publicProfile/publicProfileByUsername";

type PortfolioPreviewKind = "instagram" | "tiktok" | "youtube" | "link";

function platformLabel(platform: PortfolioPlatform): string {
  switch (platform) {
    case "INSTAGRAM":
      return "Instagram";
    case "TIKTOK":
      return "TikTok";
    case "OTHER":
      return "Bağlantı";
  }
}

function portfolioPreviewKind(item: PublicProfilePortfolioItem): PortfolioPreviewKind {
  const url = item.url.toLocaleLowerCase("tr-TR");
  if (item.platform === "INSTAGRAM") return "instagram";
  if (item.platform === "TIKTOK") return "tiktok";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "link";
}

function previewIcon(kind: PortfolioPreviewKind): LucideIcon {
  switch (kind) {
    case "instagram":
      return Camera;
    case "tiktok":
      return Music2;
    case "youtube":
      return SquarePlay;
    case "link":
      return Link2;
  }
}

function previewLabel(kind: PortfolioPreviewKind): string {
  switch (kind) {
    case "instagram":
      return "Instagram";
    case "tiktok":
      return "TikTok";
    case "youtube":
      return "YouTube";
    case "link":
      return "Bağlantı";
  }
}

function hostLabel(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function dateLabel(value: string): string | null {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat("tr-TR", { month: "short", year: "numeric" }).format(date);
}

export function PublicProfilePortfolio({
  items,
  isOwnPublicProfile,
}: {
  items: PublicProfilePortfolioItem[];
  isOwnPublicProfile: boolean;
}) {
  if (items.length === 0) {
    if (!isOwnPublicProfile) return null;

    return (
      <section
        className="public-profile-section public-profile-section--portfolio public-profile-section--portfolio-empty"
        aria-labelledby="public-profile-portfolio-heading"
      >
        <div className="public-profile-portfolio__head">
          <div>
            <h2 id="public-profile-portfolio-heading" className="public-profile-section__title">
              Portföy
            </h2>
            <p className="public-profile-portfolio__subtitle">
              Portföy eklediğinizde markalar burada seçilmiş işlerinizi görür.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="public-profile-section public-profile-section--portfolio"
      aria-labelledby="public-profile-portfolio-heading"
    >
      <div className="public-profile-portfolio__head">
        <div>
          <h2 id="public-profile-portfolio-heading" className="public-profile-section__title">
            İçerik Portföyü
          </h2>
          <p className="public-profile-portfolio__subtitle">
            Markalar için seçilmiş örnek çalışmalar ve içerikler.
          </p>
        </div>
        <span className="public-profile-portfolio__count">{items.length} içerik</span>
      </div>

      <ul className="public-profile-portfolio__grid">
        {items.map((item, index) => {
          const kind = portfolioPreviewKind(item);
          const PreviewIcon = previewIcon(kind);
          const host = hostLabel(item.url);
          const date = dateLabel(item.createdAt);
          const title = item.title?.trim() || `${platformLabel(item.platform)} içeriği`;

          return (
            <li key={`${item.createdAt}-${item.url}-${index}`} className="public-profile-portfolio-card">
              <a
                className={`public-profile-portfolio-card__media public-profile-portfolio-card__media--${kind}`}
                href={item.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`${title} bağlantısını aç`}
              >
                <span className="public-profile-portfolio-card__icon" aria-hidden>
                  <PreviewIcon size={24} strokeWidth={2.05} />
                </span>
                <span className="public-profile-portfolio-card__preview-text">Örnek içerik</span>
                <span className="public-profile-portfolio-card__media-label">{previewLabel(kind)}</span>
              </a>
              <div className="public-profile-portfolio-card__body">
                <div className="public-profile-portfolio-card__meta">
                  <span className="public-profile-portfolio-card__platform">
                    {platformLabel(item.platform)}
                  </span>
                  {host ? <span>{host}</span> : null}
                  {date ? <span>{date}</span> : null}
                </div>
                <h3 className="public-profile-portfolio-card__title">{title}</h3>
                <a
                  className="public-profile-portfolio-card__link"
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  İncele
                  <ExternalLink size={15} strokeWidth={2.05} aria-hidden />
                </a>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
