import type { UserRole } from "@prisma/client";

type Viewer = {
  id: string;
  role: UserRole;
  brand: { username: string } | null;
} | null;

/**
 * Oturumdaki marka, kendi herkese açık marka profilini mi görüntülüyor (user id veya kullanıcı adı).
 */
export function isOwnBrandPublicProfile(
  viewer: Viewer,
  profileUserId: string,
  profileUsername: string,
): boolean {
  if (!viewer || viewer.role !== "BRAND" || !viewer.brand) return false;
  if (viewer.id === profileUserId) return true;
  const a = viewer.brand.username.trim().toLowerCase();
  const b = profileUsername.trim().toLowerCase();
  return a.length > 0 && a === b;
}
