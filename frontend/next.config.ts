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

function productionMediaSrc(): string {
  const apiOrigin = productionApiOrigin();
  // Allow HTTPS evidence from Cloudinary, Railway API, etc.
  const base = "'self' data: blob: https:";
  return apiOrigin ? `${base} ${apiOrigin}` : base;
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
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
