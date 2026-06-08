import { NextResponse } from "next/server";
import { probeBackendHealth } from "@/lib/backend-health";
import { getBuildCommit } from "@/lib/build-info";

export const dynamic = "force-dynamic";

/** Synthetic monitoring endpoint — no secrets, no PII. */
export async function GET() {
  const probe = await probeBackendHealth();
  const commit = getBuildCommit();

  const status = probe.api === "degraded" ? "degraded" : "ok";
  return NextResponse.json(
    {
      status,
      frontend: "ok",
      api: probe.api,
      ...(probe.apiHost ? { apiHost: probe.apiHost } : {}),
      ...(probe.httpStatus !== undefined ? { apiHttpStatus: probe.httpStatus } : {}),
      ...(commit ? { commit: commit.slice(0, 12) } : {}),
      timestamp: new Date().toISOString(),
    },
    { status: status === "ok" ? 200 : 503 }
  );
}
