import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

function productionConnectSrc(): string {
  const api = process.env.NEXT_PUBLIC_API_URL ?? process.env.API_URL;
  if (api) {
    try {
      const origin = new URL(api).origin;
      return `'self' ${origin} https:`;
    } catch {
      /* fall through */
    }
  }
  return "'self' https:";
}

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value:
      process.env.NODE_ENV === "production"
        ? `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; media-src 'self' https://res.cloudinary.com; connect-src ${productionConnectSrc()}; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self';`
        : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://res.cloudinary.com; media-src 'self' https://res.cloudinary.com; connect-src 'self' http://localhost:4000 https:; font-src 'self' data:;",
  },
];

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.25.194.144", "localhost"],
  productionBrowserSourceMaps: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com", pathname: "/**" },
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
