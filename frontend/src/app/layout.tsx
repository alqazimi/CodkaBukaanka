import type { Metadata, Viewport } from "next";
import { Inter, Sora, Source_Serif_4 } from "next/font/google";
import { SEO_BRAND } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
  display: "swap",
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: `${SEO_BRAND.nameCompact} | Official Patient Safety Archive`,
    template: `%s | ${SEO_BRAND.nameCompact}`,
  },
  description: SEO_BRAND.defaultDescription,
  keywords: [...SEO_BRAND.keywords],
  applicationName: SEO_BRAND.nameCompact,
  authors: [{ name: SEO_BRAND.nameCompact, url: getSiteUrl() }],
  creator: SEO_BRAND.nameCompact,
  publisher: SEO_BRAND.nameCompact,
  category: "health",
  openGraph: {
    type: "website",
    locale: "so_SO",
    alternateLocale: ["en_US"],
    siteName: SEO_BRAND.nameCompact,
    title: `${SEO_BRAND.nameCompact} | ${SEO_BRAND.domain}`,
    description: SEO_BRAND.defaultDescription,
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SEO_BRAND.nameCompact }],
  },
  twitter: {
    card: "summary_large_image",
    title: SEO_BRAND.nameCompact,
    description: SEO_BRAND.defaultDescription,
    images: ["/twitter-image"],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  other: {
    google: "notranslate",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="so" className="dark bg-[#0a0a0a]">
      <body
        className={`${inter.variable} ${sora.variable} ${sourceSerif.variable} relative min-w-0 overflow-x-hidden bg-[#0a0a0a] font-sans`}
      >
        <div className="relative z-[1]">{children}</div>
      </body>
    </html>
  );
}
