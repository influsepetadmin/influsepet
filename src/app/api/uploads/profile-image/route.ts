import { NextResponse } from "next/server";
import { getSessionPayload } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import {
  PROFILE_UPLOAD_MAX_BYTES,
  saveProfileImageFile,
  validateImageBuffer,
} from "@/lib/uploads/profileImageUpload";

const ALLOWED_DECLARED_NORMALIZED = new Set(["image/jpeg", "image/png", "image/webp"]);

function normalizeClientMime(t: string): string {
  const x = t.toLowerCase().trim();
  if (x === "image/jpg") return "image/jpeg";
  return x;
}

function mimeFromDeclared(d: string): "image/jpeg" | "image/png" | "image/webp" | null {
  const n = normalizeClientMime(d);
  if (n === "image/jpeg") return "image/jpeg";
  if (n === "image/png") return "image/png";
  if (n === "image/webp") return "image/webp";
  return null;
}

export async function POST(request: Request) {
  const session = await getSessionPayload();
  if (!session) {
    return NextResponse.json({ error: "Oturum yok." }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.uid },
    select: { role: true },
  });
  if (!user || (user.role !== "INFLUENCER" && user.role !== "BRAND")) {
    return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Gecersiz istek." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Dosya gerekli." }, { status: 400 });
  }

  if (file.size > PROFILE_UPLOAD_MAX_BYTES) {
    return NextResponse.json(
      { error: "Dosya cok buyuk. En fazla 5 MB yukleyebilirsiniz." },
      { status: 400 },
    );
  }

  if (file.type) {
    const n = normalizeClientMime(file.type);
    if (!ALLOWED_DECLARED_NORMALIZED.has(n)) {
      return NextResponse.json(
        { error: "Desteklenmeyen dosya turu. JPEG, PNG veya WebP secin." },
        { status: 400 },
      );
    }
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const magic = validateImageBuffer(buffer);
  if (magic.ok === false) {
    return NextResponse.json({ error: magic.error }, { status: 400 });
  }

  if (file.type) {
    const expected = mimeFromDeclared(file.type);
    if (expected && expected !== magic.mime) {
      return NextResponse.json(
        { error: "Dosya turu ile icerik uyusmuyor." },
        { status: 400 },
      );
    }
  }

  try {
    const url = await saveProfileImageFile(buffer, magic.mime);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ error: "Yukleme basarisiz. Tekrar deneyin." }, { status: 500 });
  }
}
