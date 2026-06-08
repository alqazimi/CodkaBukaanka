"use client";

import type { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { logger } from "@/lib/logger";

type SessionVerifyResponse = {
  ok?: boolean;
  reason?: string;
  user?: { requiresMfaSetup?: boolean };
};

const MAX_ATTEMPTS = 16;
const ATTEMPT_DELAY_MS = 125;

async function verifyServerSession(): Promise<SessionVerifyResponse | null> {
  try {
    const res = await fetch("/api/admin/session/verify", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as SessionVerifyResponse;
      logger.debug("[admin][login] session verify failed", res.status, body.reason);
      return body;
    }
    return (await res.json()) as SessionVerifyResponse;
  } catch (error) {
    logger.error("[admin][login] session verify request failed", error);
    return null;
  }
}

/** Wait until NextAuth client session and server-side backend token are both ready. */
export async function waitForAdminSessionReady(): Promise<Session | null> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    const session = await getSession();
    if (session?.user?.id) {
      const verified = await verifyServerSession();
      if (verified?.ok) {
        return session;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, ATTEMPT_DELAY_MS));
  }

  logger.error("[admin][login] timed out waiting for admin session");
  return null;
}

export function resolvePostLoginTarget(session: Session | null, verify?: SessionVerifyResponse | null): string {
  const requiresMfaSetup =
    verify?.user?.requiresMfaSetup === true ||
    (session as { requiresMfaSetup?: boolean } | null)?.requiresMfaSetup === true;
  return requiresMfaSetup ? "/admin/security?setup=1" : "/admin";
}
