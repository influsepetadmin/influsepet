import type { Metadata } from "next";
import "./globals.css";
import { SiteFooterGate } from "@/components/SiteFooterGate";
import { getSiteOrigin } from "@/lib/siteUrl";

const siteDescription =
  "InfluSepet, markalar ile influencer’ları iş birlikleri için buluşturan dijital platformdur. Teklif, sohbet, teslimat ve değerlendirme süreçlerini tek çatı altında sunar.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: {
    default: "InfluSepet",
    template: "%s | InfluSepet",
  },
  description: siteDescription,
  applicationName: "InfluSepet",
  authors: [{ name: "InfluSepet" }],
  /** Favicons: `src/app/icon.png` + `apple-icon.png` (file convention; purple basket mark). Do not duplicate via `icons` here. */
  openGraph: {
    type: "website",
    locale: "tr_TR",
    siteName: "InfluSepet",
    title: "InfluSepet",
    description: siteDescription,
    url: "/",
    images: [
      {
        url: "/branding/logo-primary.png",
        alt: "InfluSepet",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "InfluSepet",
    description: siteDescription,
    images: ["/branding/logo-primary.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <main>{children}</main>
        <SiteFooterGate />
      </body>
    </html>
  );
}
