import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/me";

export type MarkaPanelAccess =
  | { ok: true; user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>> }
  | { ok: false; kind: "login" | "admin" | "wrong_role" };

/** Marka panel routes: auth + role gate. Caller renders ForbiddenStateCard for non-ok. */
export async function getMarkaPanelAccess(): Promise<MarkaPanelAccess> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/?role=BRAND&mode=login");
  }
  if (user.role === "ADMIN") {
    return { ok: false, kind: "admin" };
  }
  if (user.role !== "BRAND") {
    return { ok: false, kind: "wrong_role" };
  }
  return { ok: true, user };
}
