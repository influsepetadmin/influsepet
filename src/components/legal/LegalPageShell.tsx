import Image from "next/image";
import Link from "next/link";

export function LegalPageShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="legal-public-header">
        <Link href="/" className="legal-public-header-brand">
          <Image
            src="/branding/logo-primary.png"
            alt=""
            width={44}
            height={44}
            priority
            sizes="44px"
            className="legal-public-header-brand-icon"
          />
          <span className="legal-public-header-brand-name">InfluSepet</span>
        </Link>
        <Link href="/" className="btn secondary legal-public-header-home">
          Ana sayfa
        </Link>
      </header>
      <article className="card legal-page-card">
        <h1 className="legal-page-title">{title}</h1>
        <div className="legal-prose">{children}</div>
      </article>
    </>
  );
}
