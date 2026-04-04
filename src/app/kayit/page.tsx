import { redirect } from "next/navigation";

/**
 * Compatibility: old links used /kayit?role=… — redirect to homepage auth state.
 */
export default async function KayitPage({
  searchParams,
}: {
  searchParams?: Promise<{ role?: string; err?: string }>;
}) {
  const p = searchParams ? await searchParams : {};
  const role = p.role === "BRAND" ? "BRAND" : "INFLUENCER";
  const err = typeof p.err === "string" && p.err.trim() ? p.err : undefined;

  const qs = new URLSearchParams();
  qs.set("mode", "register");
  qs.set("role", role);
  if (err) qs.set("err", err);

  redirect(`/?${qs.toString()}`);
}
