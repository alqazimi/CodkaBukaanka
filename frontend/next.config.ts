import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function ensureHttpsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed.replace(/\/$/, "");
  return `https://${trimmed.replace(/^\/+/, "").replace(/\/$/, "")}`;
}

function productionApiOrigin(): string | null {
  const api = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
  if (!api) return null;
  try {
    return new URL(ensureHttpsUrl(api)).origin;
  } catch {
    return null;
  }
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  // Dev uses `.next-dev` (see scripts/dev.mjs) so `next build` never fights `next dev` on Windows/OneDrive.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  allowedDevOrigins: ["172.25.194.144", "localhost"],
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
      {
        protocol: "https",
        hostname: "diiwaanka-bukaanka-backend-production.up.railway.app",
        pathname: "/api/evidence/stream/**",
      },
      ...(productionApiOrigin()
        ? [
            {
              protocol: "https" as const,
              hostname: new URL(productionApiOrigin()!).hostname,
              pathname: "/**",
            },
          ]
        : []),
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  webpack: (config, { dev }) => {
    // OneDrive/Desktop paths on Windows often lock files during sync; polling avoids EBUSY write races.
    if (dev && process.platform === "win32") {
      config.watchOptions = {
        ...config.watchOptions,
        poll: 1500,
        aggregateTimeout: 800,
      };

      if (process.env.NEXT_DEV_ONEDRIVE === "1") {
        // Persistent disk cache + OneDrive sync causes EBUSY on manifest renames.
        config.cache = { type: "memory" };
      }
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...securityHeaders,
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: "/.env", destination: "/404", permanent: false },
      { source: "/.env.:path*", destination: "/404", permanent: false },
      { source: "/.git/:path*", destination: "/404", permanent: false },
      { source: "/:path*\\.bak", destination: "/404", permanent: false },
      { source: "/:path*\\.old", destination: "/404", permanent: false },
      { source: "/:path*\\.orig", destination: "/404", permanent: false },
      { source: "/:path*\\.sql", destination: "/404", permanent: false },
      { source: "/:path*\\.pem", destination: "/404", permanent: false },
      { source: "/:path*\\.key", destination: "/404", permanent: false },
      { source: "/:path*\\.log", destination: "/404", permanent: false },
      { source: "/:path*\\.map", destination: "/404", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
