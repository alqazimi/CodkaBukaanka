import { ImageResponse } from "next/og";
import { SEO_BRAND } from "@/lib/seo";

export const runtime = "edge";
export const alt = SEO_BRAND.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background: "linear-gradient(145deg, #0a0a0a 0%, #1a0505 55%, #3b0a0a 100%)",
          color: "#fafafa",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          {SEO_BRAND.name}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.05, maxWidth: 900 }}>
            {SEO_BRAND.name}
          </div>
          <div style={{ display: "flex", fontSize: 30, color: "rgba(255,255,255,0.78)", maxWidth: 920 }}>
            Official patient safety archive for Somalia
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
