import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import { basename, join } from "path";
import { validateImageBuffer } from "@/lib/uploads/profileImageUpload";
import type { CollaborationMediaKind } from "@prisma/client";
import { COLLAB_IMAGE_MAX_BYTES, COLLAB_VIDEO_MAX_BYTES } from "@/lib/uploads/collabMediaLimits";

/** Local storage root (not under /public — served only via authenticated API). */
export const COLLAB_MEDIA_DIR_SEGMENTS = ["private", "collab-media"] as const;

export { COLLAB_IMAGE_MAX_BYTES, COLLAB_VIDEO_MAX_BYTES } from "@/lib/uploads/collabMediaLimits";

export type ValidatedCollabMedia =
  | {
      kind: "IMAGE";
      mime: "image/jpeg" | "image/png" | "image/webp";
      ext: string;
    }
  | {
      kind: "VIDEO";
      mime: "video/mp4" | "video/quicktime" | "video/webm";
      ext: string;
    };

function isWebM(buf: Buffer): boolean {
  return buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3;
}

/** ISO BMFF (MP4/MOV): `ftyp` box at offset 4. */
function parseIsoBmffVideo(buf: Buffer): { mime: "video/mp4" | "video/quicktime"; ext: "mp4" | "mov" } | null {
  if (buf.length < 16) return null;
  if (buf.slice(4, 8).toString("ascii") !== "ftyp") return null;
  const brand = buf.slice(8, 12).toString("ascii");
  if (brand === "qt  ") {
    return { mime: "video/quicktime", ext: "mov" };
  }
  return { mime: "video/mp4", ext: "mp4" };
}

/**
 * Detect media type from file bytes. No re-encoding — used for validation only.
 */
export function validateCollaborationMediaBuffer(
  buf: Buffer,
): { ok: true; media: ValidatedCollabMedia } | { ok: false; error: string } {
  const img = validateImageBuffer(buf);
  if (img.ok) {
    return {
      ok: true,
      media: {
        kind: "IMAGE",
        mime: img.mime,
        ext:
          img.mime === "image/jpeg"
            ? "jpg"
            : img.mime === "image/png"
              ? "png"
              : "webp",
      },
    };
  }

  if (isWebM(buf)) {
    return { ok: true, media: { kind: "VIDEO", mime: "video/webm", ext: "webm" } };
  }

  const iso = parseIsoBmffVideo(buf);
  if (iso) {
    return {
      ok: true,
      media: {
        kind: "VIDEO",
        mime: iso.mime,
        ext: iso.ext,
      },
    };
  }

  return {
    ok: false,
    error: "Desteklenmeyen dosya. JPEG, PNG, WebP, MP4, MOV veya WebM yukleyin.",
  };
}

export function maxBytesForValidatedMedia(media: ValidatedCollabMedia): number {
  return media.kind === "IMAGE" ? COLLAB_IMAGE_MAX_BYTES : COLLAB_VIDEO_MAX_BYTES;
}

export function prismaKindFromValidated(media: ValidatedCollabMedia): CollaborationMediaKind {
  return media.kind === "IMAGE" ? "IMAGE" : "VIDEO";
}

/** Strip path components; allow safe ASCII filename for display only. */
export function sanitizeOriginalFilename(name: string | undefined | null): string | null {
  if (!name || typeof name !== "string") return null;
  const base = basename(name.trim()).slice(0, 180);
  const safe = base.replace(/[^a-zA-Z0-9._\- ]/g, "_").replace(/\s+/g, " ").trim();
  return safe.length > 0 ? safe.slice(0, 160) : null;
}

export function collabMediaAbsolutePath(storedFilename: string): string {
  const safe = basename(storedFilename);
  if (safe !== storedFilename || !/^[a-f0-9-]{36}\.[a-z0-9]+$/i.test(safe)) {
    throw new Error("Invalid stored filename");
  }
  return join(process.cwd(), ...COLLAB_MEDIA_DIR_SEGMENTS, safe);
}

export async function saveCollaborationMediaFile(
  buffer: Buffer,
  media: ValidatedCollabMedia,
): Promise<{ storedFilename: string }> {
  const storedFilename = `${randomUUID()}.${media.ext}`;
  const dir = join(process.cwd(), ...COLLAB_MEDIA_DIR_SEGMENTS);
  await mkdir(dir, { recursive: true });
  const fullPath = join(dir, storedFilename);
  await writeFile(fullPath, buffer);
  return { storedFilename };
}
