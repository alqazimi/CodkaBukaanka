import type { MetadataRoute } from "next";
import { SEO_BRAND } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_BRAND.nameCompact,
    short_name: SEO_BRAND.nameCompact,
    description: SEO_BRAND.defaultDescription,
    start_url: "/so",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "so",
    scope: "/",
    id: getSiteUrl(),
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
      { src: "/opengraph-image", sizes: "1200x630", type: "image/png", purpose: "any" },
    ],
  };
}
