/**
 * Canonical origin for metadataBase, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL in production (HTTPS, no trailing slash).
 * On Vercel, VERCEL_URL is used as a fallback when the public URL env is unset.
 */
export function getSiteOrigin(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      /* ignore invalid */
    }
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//, "");
    return `https://${host}`;
  }
  /** Dev fallback for metadataBase / sitemap only — API redirects use `sameOriginRedirect(request, ...)`. */
  return "http://localhost:3000";
}
