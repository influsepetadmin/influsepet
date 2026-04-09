import Link from "next/link";
import type { ReactNode } from "react";
import { AuthShowcaseAside } from "./AuthShowcaseAside";

export function AuthFlowShell({
  heading,
  subline,
  children,
}: {
  heading: string;
  subline?: string;
  children: ReactNode;
}) {
  return (
    <div className="auth-landing-wrap">
      <section className="auth-shell">
        <AuthShowcaseAside />
        <div className="auth-card auth-card--compact">
          <div className="auth-card-head">
            <h2 className="auth-card-heading">{heading}</h2>
            {subline ? <p className="auth-card-subline muted">{subline}</p> : null}
          </div>
          {children}
          <p className="auth-card-foot muted">
            <Link href="/">Girişe dön</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
