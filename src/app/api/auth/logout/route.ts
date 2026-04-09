import { clearSessionCookie } from "@/lib/session";
import { sameOriginRedirect } from "@/lib/sameOriginRedirect";

export async function POST(request: Request) {
  await clearSessionCookie();
  return sameOriginRedirect(request, "/");
}
