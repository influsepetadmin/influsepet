import { redirect } from "next/navigation";

/**
 * Compatibility: old entry flow used /rol-sec — homepage is the auth entry.
 */
export default function RoleSelectRedirectPage() {
  redirect("/");
}
