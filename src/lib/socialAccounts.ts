import crypto from "node:crypto";
import type { SocialPlatform } from "@prisma/client";
import { prepareUserHttpUrlInput } from "@/lib/safeUrl";

const MAX_INPUT_LEN = 512;

/** Path segments that are not profile handles on Instagram. */
const IG_SKIP_SEGMENTS = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "tv",
  "direct",
  "accounts",
  "legal",
]);

/** TikTok path prefixes that are not profile handles. */
const TT_SKIP_SEGMENTS = new Set(["video", "foryou", "following", "live", "explore"]);

/**
 * Trim, strip control chars, collapse internal whitespace, cap length.
 * Does not validate platform-specific characters yet.
 */
export function sanitizeSocialUsernameInput(input: string): string {
  let s = input.replace(/[\u0000-\u001F\u007F]/g, "").trim();
  s = s.replace(/\s+/g, " ");
  if (s.length > MAX_INPUT_LEN) s = s.slice(0, MAX_INPUT_LEN);
  return s;
}

function stripAtPrefix(s: string): string {
  return s.startsWith("@") ? s.slice(1) : s;
}

/**
 * Canonical handle for storage and uniqueness: lowercase, no @, trimmed.
 * YouTube channel IDs (UC…) are case-sensitive; we preserve them as-is.
 */
export function normalizeUsername(platform: SocialPlatform, input: string): string {
  const raw = stripAtPrefix(input.trim());
  if (platform === "YOUTUBE" && /^UC[a-zA-Z0-9_-]{10,}$/.test(raw)) {
    return raw.slice(0, 64);
  }
  let s = raw.toLowerCase();
  if (platform === "INSTAGRAM" || platform === "TIKTOK") {
    s = s.replace(/[^a-z0-9._]/g, "");
  } else {
    s = s.replace(/[^a-z0-9._-]/g, "");
  }
  if (s.length > 64) s = s.slice(0, 64);
  return s;
}

export function buildProfileUrl(platform: SocialPlatform, username: string): string {
  if (platform === "YOUTUBE" && /^UC[a-zA-Z0-9_-]{10,}$/.test(username)) {
    return `https://www.youtube.com/channel/${username}`;
  }
  const u = normalizeUsername(platform, username);
  switch (platform) {
    case "INSTAGRAM":
      return `https://www.instagram.com/${u}/`;
    case "TIKTOK":
      return `https://www.tiktok.com/@${u}`;
    case "YOUTUBE":
      return `https://www.youtube.com/@${u}`;
    default:
      return `https://www.youtube.com/@${u}`;
  }
}

/**
 * Cryptographically random code for manual / bio verification placeholders.
 * (Replace with OAuth tokens or signed challenges when integrating real providers.)
 */
export function generateVerificationCode(): string {
  return crypto.randomBytes(6).toString("base64url").slice(0, 12).toUpperCase();
}

export function looksLikeUrl(input: string): boolean {
  const s = input.trim();
  if (/^https?:\/\//i.test(s) || /^www\./i.test(s)) return true;
  return /instagram\.com|tiktok\.com|youtube\.com|youtu\.be/i.test(s);
}

function parseInstagramPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const first = parts[0];
  if (!first || IG_SKIP_SEGMENTS.has(first.toLowerCase())) return null;
  return normalizeUsername("INSTAGRAM", first);
}

function parseTikTokPath(pathname: string): string | null {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  let seg = parts[0];
  if (seg.startsWith("@")) seg = seg.slice(1);
  if (TT_SKIP_SEGMENTS.has(seg.toLowerCase())) return null;
  return normalizeUsername("TIKTOK", seg);
}

function parseYouTubePath(pathname: string, searchParams: URLSearchParams): string | null {
  const path = pathname.split("/").filter(Boolean);
  const atMatch = pathname.match(/^\/@([^/?#]+)/);
  if (atMatch) return normalizeUsername("YOUTUBE", atMatch[1]);

  if (path[0] === "c" && path[1]) return normalizeUsername("YOUTUBE", path[1]);
  if (path[0] === "user" && path[1]) return normalizeUsername("YOUTUBE", path[1]);
  if (path[0] === "channel" && path[1]) {
    const id = path[1];
    return normalizeUsername("YOUTUBE", id);
  }

  const handle = searchParams.get("channel") ?? searchParams.get("user");
  if (handle) return normalizeUsername("YOUTUBE", handle);

  return null;
}

/**
 * Extract a canonical username/handle from a full profile URL for the given platform.
 * Returns null if the URL host/path does not match the platform or no handle found.
 */
export function extractUsernameFromUrl(input: string, platform: SocialPlatform): string | null {
  const raw = input.trim();
  let url: URL;
  try {
    url = new URL(prepareUserHttpUrlInput(raw));
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./i, "").toLowerCase();

  switch (platform) {
    case "INSTAGRAM": {
      if (!host.endsWith("instagram.com")) return null;
      return parseInstagramPath(url.pathname);
    }
    case "TIKTOK": {
      if (!host.endsWith("tiktok.com")) return null;
      return parseTikTokPath(url.pathname);
    }
    case "YOUTUBE": {
      if (!host.endsWith("youtube.com") && !host.endsWith("youtu.be")) return null;
      if (host.endsWith("youtu.be")) {
        const id = url.pathname.replace(/^\//, "").split("/")[0];
        return id ? normalizeUsername("YOUTUBE", id) : null;
      }
      return parseYouTubePath(url.pathname, url.searchParams);
    }
    default:
      return null;
  }
}

export type ParsedSocialInput =
  | { ok: true; username: string }
  | { ok: false; error: string };

/**
 * From raw user input (handle or URL), produce canonical username for DB.
 */
export function parseUsernameOrUrl(platform: SocialPlatform, rawInput: string): ParsedSocialInput {
  const sanitized = sanitizeSocialUsernameInput(rawInput);
  if (!sanitized) {
    return { ok: false, error: "Kullanici adi veya URL bos olamaz." };
  }

  let username: string | null = null;
  if (looksLikeUrl(sanitized)) {
    username = extractUsernameFromUrl(sanitized, platform);
    if (!username) {
      return { ok: false, error: "URL bu platform icin cozumlenemedi veya gecersiz." };
    }
  } else {
    username = normalizeUsername(platform, sanitized);
  }

  if (!username || username.length < 1) {
    return { ok: false, error: "Gecersiz kullanici adi." };
  }

  return { ok: true, username };
}
