"use client";

import Link from "next/link";
import { Fragment } from "react";

const LABELS: Record<string, string> = {
  influencer: "Influencer",
  marka: "Marka",
  overview: "Genel bakış",
  discover: "Keşfet",
  offers: "Teklifler",
  chat: "Sohbetler",
  collaborations: "İş birlikleri",
  profile: "Profil",
  settings: "Ayarlar",
  campaigns: "Kampanyalar",
};

export function Breadcrumbs({ pathname }: { pathname: string }) {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;

  const crumbs: { href: string; label: string }[] = [];
  let acc = "";
  for (let i = 0; i < parts.length; i++) {
    const seg = parts[i];
    acc += `/${seg}`;
    let label = LABELS[seg] ?? seg;
    if (parts[0] === "chat" && i > 0) {
      label = "Görüşme";
    }
    crumbs.push({
      href: acc,
      label,
    });
  }

  return (
    <nav className="app-shell-breadcrumbs" aria-label="Sayfa konumu">
      <div className="app-shell-breadcrumbs__inner">
        {crumbs.map((c, i) => (
          <Fragment key={c.href}>
            {i > 0 ? (
              <span className="app-shell-breadcrumbs__sep" aria-hidden>
                /
              </span>
            ) : null}
            {i === crumbs.length - 1 ? (
              <span className="app-shell-breadcrumbs__current" aria-current="page">
                {c.label}
              </span>
            ) : (
              <Link href={c.href} className="app-shell-breadcrumbs__link">
                {c.label}
              </Link>
            )}
          </Fragment>
        ))}
      </div>
    </nav>
  );
}
