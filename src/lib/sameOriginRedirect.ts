import { NextResponse } from "next/server";

/**
 * Issue redirects with an absolute URL derived from the incoming request.
 * Ensures the `Location` header uses the same host/scheme as the client (avoids
 * wrong port / localhost leaking into production responses when relative URLs are resolved oddly).
 */
export function sameOriginRedirect(request: Request, pathnameAndQuery: string): NextResponse {
  if (!pathnameAndQuery.startsWith("/")) {
    throw new Error(`sameOriginRedirect: expected path starting with /, got: ${pathnameAndQuery.slice(0, 32)}`);
  }
  return NextResponse.redirect(new URL(pathnameAndQuery, request.url));
}
