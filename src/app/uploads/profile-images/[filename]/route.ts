import { readFile } from "fs/promises";
import { basename, join } from "path";
import { NextResponse } from "next/server";
import { STOCK_AVATAR_FILES } from "@/lib/avatar";
import { PROFILE_UPLOAD_DIR_SEGMENTS } from "@/lib/uploads/profileImageUpload";

function mimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function fallbackStockAvatarFilename(filename: string): string {
  let sum = 0;
  for (let i = 0; i < filename.length; i++) sum += filename.charCodeAt(i);
  return STOCK_AVATAR_FILES[sum % STOCK_AVATAR_FILES.length] ?? STOCK_AVATAR_FILES[0];
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
    // Local uploads are not durable on Railway redeploys. Serve a stable stock
    // avatar so old DB URLs fail cleanly until uploads move to R2/S3 storage.
    const fallbackFilename = fallbackStockAvatarFilename(filename);
    const fallbackFile = await readProfileImageFile(fallbackFilename);
    return new NextResponse(imageResponseBody(fallbackFile), {
      headers: {
        "Content-Type": mimeFromFilename(fallbackFilename),
        "Cache-Control": "public, max-age=300",
        "X-InfluSepet-Upload-Fallback": "profile-image-missing",
      },
    });
  }
}
