import Link from "next/link";

type Props = {
  /** Sunucuda `getDashboardBackHref()` ile: giriş + rol → panel, aksi halde `/` */
  href: string;
  /** Varsayılan: “Ana sayfaya dön” — marka paneli gibi bağlamlarda “Panele dön” kullanılabilir. */
  label?: string;
};

/**
 * Public influencer / marka profilinde “kaybolma” hissini azaltmak için üstte hafif geri bağlantısı.
 */
export function PublicProfileHomeLink({ href, label = "Ana sayfaya dön" }: Props) {
  return (
    <div className="public-profile-home-link">
      <Link className="btn secondary btn--sm public-profile-home-link__btn" href={href}>
        <span className="public-profile-home-link__icon" aria-hidden>
          ←
        </span>
        {label}
      </Link>
    </div>
  );
}
