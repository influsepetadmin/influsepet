/**
 * Central validation for user-controlled URLs stored or rendered in the app.
 * Blocks javascript:, data:, file:, vbscript:, about:, etc.
 */

const BLOCKED_PROTOCOL = /^(javascript|data|file|vbscript|about):/i;

export type SafeUrlResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

function looksDangerous(trimmed: string): boolean {
  const lower = trimmed.toLowerCase();
  if (BLOCKED_PROTOCOL.test(lower)) return true;
  // Catch scheme-smuggling without ":" at start (e.g. whitespace + javascript:)
  if (/\bjavascript\s*:/i.test(trimmed)) return true;
  if (/\bdata\s*:/i.test(trimmed)) return true;
  if (/\bvbscript\s*:/i.test(trimmed)) return true;
  return false;
}

/**
 * Optional profile / media / portfolio / delivery links: only http and https.
 * Empty input → null (field omitted).
 */
/** Relative path prefix for app-served profile uploads (public folder). */
const PROFILE_UPLOAD_RELATIVE_RE = /^\/uploads\/profile-images\/[a-zA-Z0-9._-]+$/;

/**
 * Profile image field: optional https URL, or a safe relative path under /uploads/profile-images/.
 * Empty input → null.
 */
export function parseOptionalProfileImageUrl(raw: string | null | undefined): SafeUrlResult {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  const t = String(raw).trim();
  if (!t) return { ok: true, value: null };
  if (looksDangerous(t)) {
    return { ok: false, error: "Bu baglanti turune izin verilmez." };
  }

  if (t.startsWith("/")) {
    let decoded: string;
    try {
      decoded = decodeURIComponent(t);
    } catch {
      return { ok: false, error: "Gecersiz profil resmi yolu." };
    }
    if (decoded.includes("..") || decoded.includes("\\")) {
      return { ok: false, error: "Gecersiz profil resmi yolu." };
    }
    if (!PROFILE_UPLOAD_RELATIVE_RE.test(decoded)) {
      return { ok: false, error: "Gecersiz profil resmi yolu." };
    }
    return { ok: true, value: decoded };
  }

  return parseOptionalHttpHttpsUrl(t);
}

export function parseOptionalHttpHttpsUrl(raw: string | null | undefined): SafeUrlResult {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  const t = String(raw).trim();
  if (!t) return { ok: true, value: null };
  if (looksDangerous(t)) {
    return { ok: false, error: "Bu baglanti turune izin verilmez." };
  }
  try {
    const normalized = t.includes("://") ? t : `https://${t}`;
    const u = new URL(normalized);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "Yalnizca http ve https baglantilarina izin verilir." };
    }
    return { ok: true, value: u.href };
  } catch {
    return { ok: false, error: "Gecersiz URL." };
  }
}

/**
 * Brand website field: http, https, or mailto (no embedded scripts in path beyond URL parsing).
 */
export function parseOptionalWebsiteUrl(raw: string | null | undefined): SafeUrlResult {
  if (raw === undefined || raw === null) return { ok: true, value: null };
  const t = String(raw).trim();
  if (!t) return { ok: true, value: null };
  if (looksDangerous(t)) {
    return { ok: false, error: "Bu baglanti turune izin verilmez." };
  }

  const lower = t.toLowerCase();
  if (lower.startsWith("mailto:")) {
    try {
      const u = new URL(t);
      if (u.protocol !== "mailto:") {
        return { ok: false, error: "Gecersiz mailto baglantisi." };
      }
      return { ok: true, value: u.href };
    } catch {
      return { ok: false, error: "Gecersiz mailto baglantisi." };
    }
  }

  return parseOptionalHttpHttpsUrl(t);
}
