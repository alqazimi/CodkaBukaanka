import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

const baseUrl = getSiteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/api/admin/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
