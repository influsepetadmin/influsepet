import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/me";

export type InfluencerPanelAccess =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { ok: false; kind: "login" | "admin" | "wrong_role" };

/**
 * Influencer panel routes: auth + role gate. Caller renders ForbiddenStateCard for non-ok.
 */
export async function getInfluencerPanelAccess(): Promise<InfluencerPanelAccess> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/?role=INFLUENCER&mode=login");
  }
  if (user.role === "ADMIN") {
    return { ok: false, kind: "admin" };
  }
  if (user.role !== "INFLUENCER") {
    return { ok: false, kind: "wrong_role" };
  }
  return { ok: true, user };
}
