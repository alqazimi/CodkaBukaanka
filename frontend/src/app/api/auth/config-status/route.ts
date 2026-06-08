import { NextResponse } from "next/server";
import { getAuthConfigStatus } from "@/lib/auth-config-status";

export const dynamic = "force-dynamic";

/** Public-safe auth readiness probe for login UX and ops (no secret values). */
export async function GET() {
  const status = getAuthConfigStatus();
  return NextResponse.json(status, { status: status.ready ? 200 : 503 });
}
