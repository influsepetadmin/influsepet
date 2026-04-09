/**
 * Central validation for user-controlled URLs stored or rendered in the app.
 * Blocks javascript:, data:, file:, vbscript:, about:, etc.
 */

const BLOCKED_PROTOCOL = /^(javascript|data|file|vbscript|about):/i;

export type SafeUrlResult =
  | { ok: true; value: string | null }
  | { ok: false; error: string };

/**
 * Kullanıcı girişini `new URL()` için hazırlar: şemasız alan adlarına https ekler,
 * protocol-relative (`//host/...`) adresleri https ile çözer.
 */
export function prepareUserHttpUrlInput(trimmed: string): string {
  const t = trimmed.trim();
  if (!t) return t;
  if (/^mailto:/i.test(t)) return t;
  if (t.startsWith("//")) return `https:${t}`;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) {
    return t;
  }
  return `https://${t}`;
}

/** Tek etiketli host adlarını (örn. "abc") reddetmek için — gerçek alan adlarında en az bir nokta beklenir. */
function isPlausibleHttpUrlHostname(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (h === "localhost") return true;
  if (h.startsWith("[") && h.endsWith("]")) return true;
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(h)) return true;
  if (!h.includes(".")) return false;
  const labels = h.split(".");
  if (labels.some((l) => l.length === 0)) return false;
  return h.length >= 4;
}

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
    const normalized = prepareUserHttpUrlInput(t);
    const u = new URL(normalized);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "Yalnizca http ve https baglantilarina izin verilir." };
    }
    if (!isPlausibleHttpUrlHostname(u.hostname)) {
      return { ok: false, error: "Gecersiz URL." };
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
