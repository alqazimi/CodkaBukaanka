import type { Metadata, Viewport } from "next";
import { Inter, Sora, Source_Serif_4 } from "next/font/google";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600", "700", "800"],
});

const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "CodkaBukaanka | Patient Registry Archive",
    template: "%s | CodkaBukaanka",
  },
  description:
    "Verified public documentation archive for medication errors, misdiagnosis, and patient safety incidents in Somalia.",
  openGraph: {
    type: "website",
    locale: "so_SO",
    alternateLocale: ["en_US"],
    siteName: "CodkaBukaanka",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  other: {
    "google": "notranslate",
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
