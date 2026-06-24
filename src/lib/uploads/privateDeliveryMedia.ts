export const DELIVERY_MEDIA_OBJECT_PREFIX = "delivery-media/" as const;
export const DELIVERY_MEDIA_PART_SIZE_BYTES = 8 * 1024 * 1024;
export const DELIVERY_MEDIA_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const DELIVERY_MEDIA_VIDEO_MAX_BYTES = 200 * 1024 * 1024;

const DELIVERY_MEDIA_EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

const DELIVERY_MEDIA_OBJECT_KEY_RE =
  /^delivery-media\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpg|png|webp|mp4|mov|webm)$/i;

const LEGACY_LOCAL_FILENAME_RE =
  /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\.(?:jpg|png|webp|mp4|mov|webm)$/i;

export type DeliveryMediaStorageProvider = "LOCAL" | "R2";

export type DeliveryMediaStorageRecord = {
  storageProvider?: DeliveryMediaStorageProvider | null;
  storedFilename: string;
  objectKey?: string | null;
};

export type ByteRange = { offset: number; length?: number };

export function extensionForDeliveryMediaMime(mimeType: string): string | null {
  return DELIVERY_MEDIA_EXT_BY_MIME[mimeType] ?? null;
}

export function maxBytesForDeliveryMediaMime(mimeType: string): number | null {
  if (mimeType.startsWith("image/") && extensionForDeliveryMediaMime(mimeType)) {
    return DELIVERY_MEDIA_IMAGE_MAX_BYTES;
  }
  if (mimeType.startsWith("video/") && extensionForDeliveryMediaMime(mimeType)) {
    return DELIVERY_MEDIA_VIDEO_MAX_BYTES;
  }
  return null;
}

export function isValidDeliveryMediaObjectKey(value: string | null | undefined): value is string {
  return typeof value === "string" && DELIVERY_MEDIA_OBJECT_KEY_RE.test(value);
}

export function isValidLegacyDeliveryMediaFilename(value: string | null | undefined): value is string {
  return typeof value === "string" && LEGACY_LOCAL_FILENAME_RE.test(value);
}

export function resolveDeliveryMediaObjectKey(record: DeliveryMediaStorageRecord): string | null {
  if ((record.storageProvider ?? "LOCAL") !== "R2") {
    return null;
  }
  return isValidDeliveryMediaObjectKey(record.objectKey) ? record.objectKey : null;
}

export function validateDeliveryMediaStorageRecord(record: DeliveryMediaStorageRecord): boolean {
  const provider = record.storageProvider ?? "LOCAL";
  if (provider === "LOCAL") {
    return isValidLegacyDeliveryMediaFilename(record.storedFilename);
  }
  if (provider === "R2") {
    return isValidDeliveryMediaObjectKey(record.objectKey);
  }
  return false;
}

export function parseHttpRangeHeader(rangeHeader: string | null | undefined): ByteRange | null {
  if (!rangeHeader) return null;
  const match = rangeHeader.trim().match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;

  const [, startRaw, endRaw] = match;
  if (!startRaw && !endRaw) return null;
  if (!startRaw) {
    const suffixLength = Number(endRaw);
    if (!Number.isSafeInteger(suffixLength) || suffixLength <= 0) return null;
    return { offset: -suffixLength };
  }

  const start = Number(startRaw);
  if (!Number.isSafeInteger(start) || start < 0) return null;

  if (!endRaw) {
    return { offset: start };
  }

  const end = Number(endRaw);
  if (!Number.isSafeInteger(end) || end < start) return null;
  return { offset: start, length: end - start + 1 };
}
