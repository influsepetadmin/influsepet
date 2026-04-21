import { parseOptionalHttpHttpsUrl } from "@/lib/safeUrl";

export const DELIVERY_PARSE_TEXT_TOO_LONG = "Metin cok uzun.";

/** En az biri: baglantı, not veya yuklenen dosya. */
export const DELIVERY_PARSE_REQUIRED =
  "Teslim baglantisi, not veya en az bir kanit dosyasi gerekli.";

export function parseDeliveryUrlAndText(input: {
  rawUrl: string;
  rawText: string;
}): { deliveryUrl: string | null; deliveryText: string | null; error?: string } {
  const rawUrl = input.rawUrl.trim();
  const rawText = input.rawText.trim();

  if (rawUrl.length > 2000 || rawText.length > 8000) {
    return { deliveryUrl: null, deliveryText: null, error: DELIVERY_PARSE_TEXT_TOO_LONG };
  }

  if (!rawUrl && !rawText) {
    return { deliveryUrl: null, deliveryText: null };
  }

  if (rawUrl) {
    const safe = parseOptionalHttpHttpsUrl(rawUrl);
    if (safe.ok === false) {
      return { deliveryUrl: null, deliveryText: null, error: safe.error };
    }
    const deliveryUrl = safe.value;
    if (deliveryUrl == null) {
      return { deliveryUrl: null, deliveryText: null, error: "Gecersiz URL." };
    }
    return {
      deliveryUrl,
      deliveryText: rawText || null,
    };
  }

  return {
    deliveryUrl: null,
    deliveryText: rawText || null,
  };
}
