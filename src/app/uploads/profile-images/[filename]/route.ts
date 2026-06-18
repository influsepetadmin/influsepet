import { readFile } from "fs/promises";
import { basename, join } from "path";
import { NextResponse } from "next/server";
import { getAvatarPlaceholderSvg } from "@/lib/avatar";
import { PROFILE_UPLOAD_DIR_SEGMENTS } from "@/lib/uploads/profileImageUpload";

function mimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function readProfileImageFile(filename: string): Promise<Buffer> {
  const fullPath = join(process.cwd(), ...PROFILE_UPLOAD_DIR_SEGMENTS, filename);
  return readFile(fullPath);
}

function imageResponseBody(file: Buffer): Blob {
  return new Blob([new Uint8Array(file)]);
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename: requestedFilename } = await context.params;
  const filename = basename(requestedFilename);
  if (filename !== requestedFilename || !/^[a-zA-Z0-9._-]+$/.test(filename)) {
    return NextResponse.json({ error: "Dosya bulunamadi." }, { status: 404 });
  }

  try {
    const file = await readProfileImageFile(filename);

    return new NextResponse(imageResponseBody(file), {
      headers: {
        "Content-Type": mimeFromFilename(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    // Local uploads are not durable on Railway redeploys. Missing files must
    // fall back to a neutral generated placeholder, never another user's upload.
    return new NextResponse(getAvatarPlaceholderSvg(), {
      headers: {
        "Content-Type": "image/svg+xml; charset=utf-8",
        "Cache-Control": "no-store",
        "X-InfluSepet-Upload-Fallback": "profile-image-missing",
        "X-Influsepet-Missing-Upload": "true",
      },
    });
  }
}
