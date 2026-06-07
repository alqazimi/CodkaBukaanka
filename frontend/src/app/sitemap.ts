import type { MetadataRoute } from "next";
import { serverApi } from "@/lib/api";
import { absoluteSiteUrl, localePath, SEO_LOCALES } from "@/lib/seo";

const staticPaths = [
  { path: "", priority: 1, changeFrequency: "daily" as const },
  { path: "/search", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/categories", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/hospitals", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/patients", priority: 0.85, changeFrequency: "weekly" as const },
  { path: "/doctors", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/medications", priority: 0.8, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/submit-case", priority: 0.75, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/corrections", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/privacy", priority: 0.5, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.5, changeFrequency: "yearly" as const },
];

function withAlternates(path: string, lastModified: Date, priority: number, changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]) {
  const languages = Object.fromEntries(
    SEO_LOCALES.map((locale) => [locale, absoluteSiteUrl(localePath(locale, path))])
  ) as Record<string, string>;
  languages["x-default"] = absoluteSiteUrl(localePath("so", path));

  return SEO_LOCALES.map((locale) => ({
    url: absoluteSiteUrl(localePath(locale, path)),
    lastModified,
    changeFrequency,
    priority,
    alternates: { languages },
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let data: {
    cases: { slug: string; updatedAt: string }[];
    hospitals: { slug: string; updatedAt: string }[];
    patients: { slug: string; updatedAt: string }[];
    doctors: { slug: string; updatedAt: string }[];
    medications: { slug: string; updatedAt: string }[];
  } | null = null;

  try {
    data = await serverApi.get("/api/sitemap", { next: { revalidate: 3600 } });
  } catch {
    /* backend offline */
  }

  const entries: MetadataRoute.Sitemap = [];

  for (const item of staticPaths) {
    entries.push(...withAlternates(item.path, new Date(), item.priority, item.changeFrequency));
  }

  if (data) {
    const dynamic = [
      ...data.cases.map((row) => ({ prefix: "/cases", ...row, priority: 0.9, changeFrequency: "monthly" as const })),
      ...data.hospitals.map((row) => ({ prefix: "/hospitals", ...row, priority: 0.8, changeFrequency: "weekly" as const })),
      ...data.patients.map((row) => ({ prefix: "/patients", ...row, priority: 0.8, changeFrequency: "weekly" as const })),
      ...data.doctors.map((row) => ({ prefix: "/doctors", ...row, priority: 0.7, changeFrequency: "weekly" as const })),
      ...data.medications.map((row) => ({ prefix: "/medications", ...row, priority: 0.7, changeFrequency: "weekly" as const })),
    ];

    for (const row of dynamic) {
      const path = `${row.prefix}/${row.slug}`;
      entries.push(
        ...withAlternates(path, new Date(row.updatedAt), row.priority, row.changeFrequency)
      );
    }
  }

  return entries;
}
