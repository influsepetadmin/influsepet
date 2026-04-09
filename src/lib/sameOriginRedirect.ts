import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/siteUrl";

/**
 * Issue redirects with an absolute URL using the canonical public site URL
 * (see `getSiteUrl`) so `Location` is never built from internal proxy/runtime hosts.
 */
export function sameOriginRedirect(pathnameAndQuery: string): NextResponse {
  if (!pathnameAndQuery.startsWith("/")) {
    throw new Error(`sameOriginRedirect: expected path starting with /, got: ${pathnameAndQuery.slice(0, 32)}`);
  }
  return NextResponse.redirect(new URL(pathnameAndQuery, getSiteUrl()));
}
