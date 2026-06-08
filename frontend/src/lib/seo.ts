import type { Metadata } from "next";
import { getSiteUrl } from "@/lib/env";

/** Brand constants for titles, schema, and keyword targeting. */
export const SEO_BRAND = {
  /** Primary public brand — used for Google site name, Open Graph, and schema. */
  name: "Codka Bukaanka",
  nameSpaced: "Codka Bukaanka",
  nameCompact: "CodkaBukaanka",
  domain: "codkabukaanka.com",
  alternateNames: [
    "Codka Bukaanka",
    "CodkaBukaanka",
    "codkabukaanka",
    "Diiwaanka Bukaanka",
    "Patient Registry Archive",
  ],
  defaultDescription:
    "Codka Bukaanka is the official patient voice and healthcare safety archive for Somalia — search verified healthcare safety cases.",
  keywords: [
    "CodkaBukaanka",
    "codkabukaanka",
    "Codka Bukaanka",
    "codkabukaanka.com",
    "patient voice",
    "healthcare platform",
    "patient safety Somalia",
    "medical incident archive",
    "medication errors Somalia",
    "Diiwaanka Bukaanka",
    "healthcare accountability",
  ],
} as const;

export const SEO_LOCALES = ["so", "en"] as const;
export const SEO_DEFAULT_LOCALE = "so";

export function absoluteSiteUrl(path = ""): string {
  const base = getSiteUrl().replace(/\/$/, "");
  if (!path) return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function localePath(locale: string, path = ""): string {
  const suffix = path ? (path.startsWith("/") ? path : `/${path}`) : "";
  return `/${locale}${suffix}`;
}

export function buildLanguageAlternates(path = "") {
  return {
    languages: {
      so: localePath("so", path),
      en: localePath("en", path),
      "x-default": localePath(SEO_DEFAULT_LOCALE, path),
    },
  };
}

export function brandTitle(pageTitle: string): string {
  if (/codka\s*bukaanka|codkabukaanka/i.test(pageTitle)) return pageTitle;
  return `${pageTitle} | ${SEO_BRAND.name}`;
}

type BuildPageMetadataOptions = {
  title: string;
  description: string;
  locale: string;
  path?: string;
  ogType?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
};

export function buildPageMetadata(options: BuildPageMetadataOptions): Metadata {
  const path = options.path ?? "";
  const canonical = absoluteSiteUrl(localePath(options.locale, path));
  const fullTitle = brandTitle(options.title);
  const description = options.description.slice(0, 160);
  const keywords = options.keywords ?? [...SEO_BRAND.keywords];

  const metadata: Metadata = {
    title: options.title,
    description,
    keywords,
    applicationName: SEO_BRAND.name,
    alternates: {
      canonical,
      ...buildLanguageAlternates(path),
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonical,
      siteName: SEO_BRAND.name,
      locale: options.locale === "so" ? "so_SO" : "en_US",
      alternateLocale: options.locale === "so" ? ["en_US"] : ["so_SO"],
      type: options.ogType ?? "website",
      images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: SEO_BRAND.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: ["/twitter-image"],
    },
    robots: options.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };

  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  if (googleVerification) {
    metadata.verification = { google: googleVerification };
  }

  return metadata;
}

export type BreadcrumbItem = { name: string; path?: string };

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[], locale: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      ...(item.path
        ? { item: absoluteSiteUrl(localePath(locale, item.path)) }
        : {}),
    })),
  };
}
