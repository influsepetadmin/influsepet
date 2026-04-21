import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { basename, join } from "path";
import type { ValidatedCollabMedia } from "@/lib/uploads/collabMediaUpload";

/** Teslim kanıtları — chat medyasından ayrı dizin; yalnızca API üzerinden servis. */
export const DELIVERY_MEDIA_DIR_SEGMENTS = ["private", "delivery-media"] as const;

export function deliveryMediaAbsolutePath(storedFilename: string): string {
  const safe = basename(storedFilename);
  if (safe !== storedFilename || !/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(safe)) {
    throw new Error("Invalid stored filename");
  }
  return join(process.cwd(), ...DELIVERY_MEDIA_DIR_SEGMENTS, safe);
}

export async function saveDeliveryMediaFile(
  buffer: Buffer,
  media: ValidatedCollabMedia,
): Promise<{ storedFilename: string }> {
  const storedFilename = `${randomUUID()}.${media.ext}`;
  const dir = join(process.cwd(), ...DELIVERY_MEDIA_DIR_SEGMENTS);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, storedFilename), buffer);
  return { storedFilename };
}
