import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter, Source_Serif_4 } from "next/font/google";
import { getSiteUrl } from "@/lib/env";
import { AnimatedSiteBackground } from "@/components/layout/AnimatedSiteBackground";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ThemeScript } from "@/components/theme/theme-script";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-geist-sans",
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
  robots: { index: true, follow: true },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="so" suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceSerif.variable} relative min-w-0 overflow-x-hidden font-sans`}>
        <ThemeScript nonce={nonce} />
        <ThemeProvider>
          <AnimatedSiteBackground />
          <div className="relative z-[1]">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
