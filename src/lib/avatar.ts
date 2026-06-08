export const STOCK_AVATAR_FILES = [
  "1774459094289-92763171-b8b4-41fd-b7c1-b63a3ea10291.png",
  "1774459371126-893ff0cf-e82e-42de-a197-c9be9dff6f00.jpg",
  "1774459930714-4eb436c0-1faf-46fc-ba3a-beca124b0a66.jpg",
  "1774459946479-9237c37d-1427-4627-a715-1b5d98603ee7.jpg",
] as const;

/**
 * Seed / placeholder files used when no real profile photo exists — not a user upload.
 * Profile editor should not treat these as an uploaded preview.
 */
export function isStockProfileImageUrl(url: string): boolean {
  const t = url.trim();
  if (!t) return false;
  let pathPart = t;
  try {
    if (t.includes("://")) {
      pathPart = new URL(t).pathname;
    }
  } catch {
    /* relative path */
  }
  const file = pathPart.split("/").filter(Boolean).pop() ?? "";
  return (STOCK_AVATAR_FILES as readonly string[]).includes(file);
}

export type AvatarPlaceholderKind = "person" | "brand";

export function getAvatarPlaceholderSvg(kind: AvatarPlaceholderKind = "person"): string {
  const glyph =
    kind === "brand"
      ? `<rect x="50" y="48" width="60" height="54" rx="12" fill="#94a3b8"/>
         <path d="M64 48c2-12 10-20 16-20s14 8 16 20" fill="none" stroke="#94a3b8" stroke-width="8" stroke-linecap="round"/>
         <rect x="64" y="65" width="12" height="12" rx="3" fill="#f8fafc"/>
         <rect x="84" y="65" width="12" height="12" rx="3" fill="#f8fafc"/>`
      : `<circle cx="80" cy="58" r="24" fill="#94a3b8"/>
         <path d="M36 124c6-26 24-42 44-42s38 16 44 42" fill="#94a3b8"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="">
    <rect width="160" height="160" rx="80" fill="#f1f5f9"/>
    <circle cx="80" cy="80" r="74" fill="none" stroke="#e2e8f0" stroke-width="4"/>
    ${glyph}
  </svg>`;
}

export function getAvatarUrl(_userId: string, kind: AvatarPlaceholderKind = "person") {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(getAvatarPlaceholderSvg(kind))}`;
}

export function getProfileImageOrAvatarUrl(
  rawUrl: string | null | undefined,
  userId: string,
  kind: AvatarPlaceholderKind = "person",
) {
  const trimmed = rawUrl?.trim() ?? "";
  if (trimmed && !isStockProfileImageUrl(trimmed)) return trimmed;
  return getAvatarUrl(userId, kind);
}
