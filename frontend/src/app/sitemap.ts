import type { MetadataRoute } from "next";
import { serverApi } from "@/lib/api";
import { getSiteUrl } from "@/lib/env";

const baseUrl = getSiteUrl();
const locales = ["so", "en"] as const;

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

  const staticPaths = ["", "/search", "/hospitals", "/patients", "/doctors", "/medications", "/about", "/privacy", "/terms", "/contact", "/corrections"];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({ url: `${baseUrl}/${locale}${path}`, lastModified: new Date(), changeFrequency: "weekly", priority: path === "" ? 1 : 0.8 });
    }
    if (data) {
      for (const c of data.cases) entries.push({ url: `${baseUrl}/${locale}/cases/${c.slug}`, lastModified: new Date(c.updatedAt), changeFrequency: "monthly", priority: 0.9 });
      for (const h of data.hospitals) entries.push({ url: `${baseUrl}/${locale}/hospitals/${h.slug}`, lastModified: new Date(h.updatedAt), changeFrequency: "weekly", priority: 0.8 });
      for (const p of data.patients) entries.push({ url: `${baseUrl}/${locale}/patients/${p.slug}`, lastModified: new Date(p.updatedAt), changeFrequency: "weekly", priority: 0.8 });
      for (const d of data.doctors) entries.push({ url: `${baseUrl}/${locale}/doctors/${d.slug}`, lastModified: new Date(d.updatedAt), changeFrequency: "weekly", priority: 0.7 });
      for (const m of data.medications) entries.push({ url: `${baseUrl}/${locale}/medications/${m.slug}`, lastModified: new Date(m.updatedAt), changeFrequency: "weekly", priority: 0.7 });
    }
  }
  return entries;
}
