import { auth } from "@/auth";
import { ensureHttpsUrl, getServerApiUrl } from "@/lib/env";
import { getBackendAccessToken } from "@/lib/get-backend-token";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Short-lived upload target for large files (bypasses Vercel's ~4MB proxy body limit). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = await getBackendAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const uploadUrl = new URL("/api/admin/upload", `${ensureHttpsUrl(getServerApiUrl())}/`).toString();

  return NextResponse.json({
    uploadUrl,
    accessToken,
    maxDirectBytes: 50 * 1024 * 1024,
  });
}
