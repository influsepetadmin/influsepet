/** Public marka kullanıcı adı: küçük harf, rakam, alt çizgi. */
export function normalizeBrandUsername(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "");
}

export function validateBrandUsernameNormalized(normalized: string): { ok: true } | { ok: false; message: string } {
  if (normalized.length === 0) {
    return { ok: true };
  }
  if (normalized.length < 3) {
    return { ok: false, message: "Kullanıcı adı en az 3 karakter olmalıdır." };
  }
  if (normalized.length > 32) {
    return { ok: false, message: "Kullanıcı adı en fazla 32 karakter olabilir." };
  }
  return { ok: true };
}
