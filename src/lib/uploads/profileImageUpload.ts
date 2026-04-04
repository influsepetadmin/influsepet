import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";

/** Max upload size for profile images (5 MB). */
export const PROFILE_UPLOAD_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_UPLOAD_DIR_SEGMENTS = ["public", "uploads", "profile-images"] as const;

export const PROFILE_UPLOAD_PUBLIC_PREFIX = "/uploads/profile-images";

const MIME_TO_EXT: Record<"image/jpeg" | "image/png" | "image/webp", string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function extensionForMime(mime: "image/jpeg" | "image/png" | "image/webp"): string {
  return MIME_TO_EXT[mime];
}

export function validateImageBuffer(
  buf: Buffer,
): { ok: true; mime: "image/jpeg" | "image/png" | "image/webp" } | { ok: false; error: string } {
  if (buf.length < 12) {
    return { ok: false, error: "Dosya cok kucuk veya gecersiz." };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ok: true, mime: "image/jpeg" };
  }
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { ok: true, mime: "image/png" };
  }
  if (
    buf.toString("ascii", 0, 4) === "RIFF" &&
    buf.length >= 12 &&
    buf.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { ok: true, mime: "image/webp" };
  }
  return { ok: false, error: "Desteklenmeyen gorsel formati. JPEG, PNG veya WebP yukleyin." };
}

export async function saveProfileImageFile(
  buffer: Buffer,
  mime: "image/jpeg" | "image/png" | "image/webp",
): Promise<string> {
  const ext = extensionForMime(mime);
  const name = `${randomUUID()}.${ext}`;
  const dir = join(process.cwd(), ...PROFILE_UPLOAD_DIR_SEGMENTS);
  await mkdir(dir, { recursive: true });
  const fullPath = join(dir, name);
  await writeFile(fullPath, buffer);
  return `${PROFILE_UPLOAD_PUBLIC_PREFIX}/${name}`;
}
