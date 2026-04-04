import type { MetadataRoute } from "next";
import { getSiteOrigin } from "@/lib/siteUrl";

/** Statik, herkese açık sayfalar (dinamik / oturum gerektiren rotalar dahil değil). */
const PUBLIC_PATHS: {
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/hakkimizda", changeFrequency: "monthly", priority: 0.8 },
  { path: "/iletisim", changeFrequency: "monthly", priority: 0.8 },
  { path: "/gizlilik-politikasi", changeFrequency: "yearly", priority: 0.6 },
  { path: "/kvkk-aydinlatma-metni", changeFrequency: "yearly", priority: 0.6 },
  { path: "/kullanim-kosullari", changeFrequency: "yearly", priority: 0.6 },
  { path: "/iptal-iade-hizmet-kosullari", changeFrequency: "yearly", priority: 0.6 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = getSiteOrigin();
  const lastModified = new Date();
  return PUBLIC_PATHS.map(({ path, changeFrequency, priority }) => ({
    url: path === "/" ? `${origin}/` : `${origin}${path}`,
    lastModified,
    changeFrequency,
    priority,
  }));
}
