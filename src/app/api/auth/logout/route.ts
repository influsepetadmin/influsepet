import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/session";

function getRequestOrigin(request: Request): string {
  const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const forwardedHost = request.headers.get("x-forwarded-host")?.split(",")[0]?.trim();

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {}
  }

  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const origin = getRequestOrigin(request);
  await clearSessionCookie();
  return NextResponse.redirect(new URL("/", origin));
}
