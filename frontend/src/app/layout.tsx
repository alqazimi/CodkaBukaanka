import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: {
    default: "CodkaBukaanka | Patient Registry Archive",
    template: "%s | CodkaBukaanka",
  },
  description:
    "Verified public documentation archive for medication errors, misdiagnosis, and patient safety incidents in Somalia.",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["so_SO"],
    siteName: "CodkaBukaanka",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${sourceSerif.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
