import { ImageResponse } from "next/og";
import { BrandIconImage } from "@/lib/brand-icon-image";

export const runtime = "edge";
export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(<BrandIconImage size={48} padding={6} />, { ...size });
}
