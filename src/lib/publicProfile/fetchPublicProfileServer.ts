import { headers } from "next/headers";
import type { PublicProfileByUsernameResponse } from "@/lib/publicProfile/publicProfileByUsername";

/** Server-side fetch to the public profile API (same origin). */
export async function fetchPublicProfileByUsername(
  username: string,
): Promise<PublicProfileByUsernameResponse | null> {
  const trimmed = username.trim();
  if (!trimmed) return null;

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return null;
  const proto = h.get("x-forwarded-proto") ?? "http";
  const url = `${proto}://${host}/api/public-profile/${encodeURIComponent(trimmed)}`;

  const res = await fetch(url, { next: { revalidate: 60 } });
  if (res.status === 404) return null;
  if (!res.ok) return null;
  return (await res.json()) as PublicProfileByUsernameResponse;
}
