import { COLLAB_IMAGE_MAX_BYTES } from "@/lib/uploads/collabMediaLimits";

/** Tek teslim isteğinde en fazla dosya sayısı. */
export const DELIVERY_MEDIA_MAX_FILES = 8;

/**
 * Teslim kanıtı videoları — geçici üst sınır (sohbet medyası 100 MB kalır).
 * Doğrudan depolama geldiğinde bu sabit tek yerden güncellenir.
 */
export const DELIVERY_VIDEO_MAX_BYTES = 200 * 1024 * 1024;

const DELIVERY_VIDEO_MAX_MB = Math.round(DELIVERY_VIDEO_MAX_BYTES / (1024 * 1024));
const DELIVERY_IMAGE_MAX_MB = Math.round(COLLAB_IMAGE_MAX_BYTES / (1024 * 1024));

export function deliveryVideoTooLargeMessage(): string {
  return `Video en fazla ${DELIVERY_VIDEO_MAX_MB} MB olabilir.`;
}

export function deliveryImageTooLargeMessage(): string {
  return `Goruntu en fazla ${DELIVERY_IMAGE_MAX_MB} MB olabilir.`;
}
