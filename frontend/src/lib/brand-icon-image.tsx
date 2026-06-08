import { brandMarkDataUri } from "@/lib/brand-mark-svg";

type BrandIconImageProps = {
  size: number;
  padding?: number;
};

/** Shield mark centered on brand background — used by Next.js icon routes. */
export function BrandIconImage({ size, padding = 0 }: BrandIconImageProps) {
  const markSize = size - padding * 2;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(145deg, #0a0a0a 0%, #1a0505 55%, #3b0a0a 100%)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brandMarkDataUri("brand-icon-gradient")} alt="" width={markSize} height={markSize} />
    </div>
  );
}
