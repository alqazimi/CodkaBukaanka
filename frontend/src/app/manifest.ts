import type { MetadataRoute } from "next";
import { SEO_BRAND } from "@/lib/seo";
import { getSiteUrl } from "@/lib/env";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SEO_BRAND.name,
    short_name: SEO_BRAND.nameSpaced,
    description: SEO_BRAND.defaultDescription,
    start_url: "/so",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "so",
    scope: "/",
    id: getSiteUrl(),
    icons: [
      { src: "/icon", sizes: "48x48", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png", purpose: "any" },
      { src: "/logo.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
