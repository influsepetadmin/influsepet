import { AuthLandingShell } from "@/components/auth/AuthLandingShell";
import type { AuthMode, AuthRole } from "@/components/auth/UnifiedAuthEntry";

export default async function GirisPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string; mode?: string; err?: string }>;
}) {
  const p = searchParams ? await searchParams : {};
  const role: AuthRole = p.role === "BRAND" ? "BRAND" : "INFLUENCER";
  const mode: AuthMode = p.mode === "register" ? "register" : "login";
  const err = p.err != null && String(p.err).trim() !== "" ? String(p.err) : null;

  return (
    <AuthLandingShell
      initialRole={role}
      initialMode={mode}
      initialErr={err}
      basePath="/giris"
      showFooterContact
    />
  );
}
