import { redirect } from "next/navigation";

/** Canonical chat UI lives at `/chat`. */
export default function MarkaChatRedirectPage() {
  redirect("/chat");
}
