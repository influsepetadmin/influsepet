import { readFile } from "fs/promises";
import { join } from "path";
import { NextResponse } from "next/server";

function mimeFromFilename(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const { filename } = await context.params;

  try {
    const fullPath = join(process.cwd(), "public", "uploads", "profile-images", filename);
    const file = await readFile(fullPath);

    return new NextResponse(file, {
      headers: {
        "Content-Type": mimeFromFilename(filename),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Dosya bulunamadi." }, { status: 404 });
  }
}
