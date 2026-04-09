import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/SiteFooter";
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
  /** Tab + home-screen: purple basket mark only (`logo-primary` stays for OG / full wordmark UI). */
  icons: {
    icon: [{ url: "/branding/influsepet-logo-icon.png", type: "image/png" }],
    apple: [{ url: "/branding/influsepet-logo-icon.png", type: "image/png" }],
  },
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
        <SiteFooter />
      </body>
    </html>
  );
}
