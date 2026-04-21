import type { UserRole } from "@prisma/client";

type Viewer = {
  id: string;
  role: UserRole;
  influencer: { username: string } | null;
} | null;

/**
 * Logged-in influencer, kendi herkese açık profilini mi görüntülüyor (user id veya kullanıcı adı).
 */
export function isOwnInfluencerPublicProfile(
  viewer: Viewer,
  profileUserId: string,
  profileUsername: string,
): boolean {
  if (!viewer || viewer.role !== "INFLUENCER" || !viewer.influencer) return false;
  if (viewer.id === profileUserId) return true;
  const a = viewer.influencer.username.trim().toLowerCase();
  const b = profileUsername.trim().toLowerCase();
  return a.length > 0 && a === b;
}
