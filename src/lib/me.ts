import type { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSessionPayload } from "@/lib/session";

export async function getCurrentUser() {
  const session = await getSessionPayload();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.uid },
    include: {
      influencer: { include: { selectedCategories: true } },
      brand: { include: { selectedCategories: true } },
    },
  });
}

/** Safe home for “Geri dön” from public profile pages: role dashboard or landing. */
export function dashboardHomeHrefForRole(role: UserRole | null | undefined): string {
  if (role === "INFLUENCER") return "/influencer";
  if (role === "BRAND") return "/marka";
  return "/";
}

export async function getDashboardBackHref(): Promise<string> {
  const user = await getCurrentUser();
  return dashboardHomeHrefForRole(user?.role);
}
