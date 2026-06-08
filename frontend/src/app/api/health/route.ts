import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Synthetic monitoring endpoint — no secrets, no PII. */
export async function GET() {
  const apiUrl = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  let api: "ok" | "degraded" | "unconfigured" = "unconfigured";

  if (apiUrl) {
    try {
      const res = await fetch(new URL("/health", apiUrl.replace(/\/$/, "")), {
        cache: "no-store",
        signal: AbortSignal.timeout(8000),
      });
      api = res.ok ? "ok" : "degraded";
    } catch {
      api = "degraded";
    }
  }

  const status = api === "degraded" ? "degraded" : "ok";
  return NextResponse.json(
    {
      status,
      frontend: "ok",
      api,
      timestamp: new Date().toISOString(),
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
