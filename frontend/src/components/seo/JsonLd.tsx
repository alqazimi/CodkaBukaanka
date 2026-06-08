import { headers } from "next/headers";
import { serializeJsonLd } from "@/lib/safe-json-ld";

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export async function JsonLd({ data }: JsonLdProps) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <script
      type="application/ld+json"
      {...(nonce ? { nonce } : {})}
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
