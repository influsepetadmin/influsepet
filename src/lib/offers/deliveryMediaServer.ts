import { DELIVERY_VIDEO_MAX_BYTES } from "@/lib/offers/deliverySubmitConstants";
import { COLLAB_IMAGE_MAX_BYTES } from "@/lib/uploads/collabMediaLimits";
import type { ValidatedCollabMedia } from "@/lib/uploads/collabMediaUpload";

/** Teslim POST’unda kullanılan boyut tavanı (video teslim için yükseltilmiş). */
export function maxBytesForDeliveryMedia(media: ValidatedCollabMedia): number {
  return media.kind === "IMAGE" ? COLLAB_IMAGE_MAX_BYTES : DELIVERY_VIDEO_MAX_BYTES;
}
