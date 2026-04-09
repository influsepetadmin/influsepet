/**
 * Public site URL for redirects, password-reset links, metadata, sitemap.
 * Set NEXT_PUBLIC_SITE_URL in each environment (HTTPS, no trailing slash recommended).
 */
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL;
  }

  return "https://influsepet-production.up.railway.app";
}

/** Canonical origin (scheme + host) for metadataBase, sitemap, robots. */
export function getSiteOrigin(): string {
  try {
    return new URL(getSiteUrl()).origin;
  } catch {
    return "https://influsepet-production.up.railway.app";
  }
}
