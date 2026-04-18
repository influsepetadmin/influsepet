import { redirect } from "next/navigation";

/** Eski uzun panel URL’si — sorgu parametreleri korunur (ör. ?err=). */
export default async function MarkaRootPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : {};
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) v.forEach((x) => q.append(k, x));
    else q.set(k, v);
  }
  const suffix = q.toString() ? `?${q.toString()}` : "";
  redirect(`/marka/overview${suffix}`);
}
