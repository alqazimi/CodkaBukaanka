"use client";

import type { Session } from "next-auth";
import { getSession } from "next-auth/react";
import { isAuthConfigurationError } from "@/lib/auth-config-status";
import { logger } from "@/lib/logger";

type SessionVerifyResponse = {
  ok?: boolean;
  reason?: string;
  user?: { requiresMfaSetup?: boolean };
};

export type SessionWaitFailure =
  | "timeout"
  | "auth_misconfigured"
  | "verify_failed";

const MAX_ATTEMPTS = 16;
const ATTEMPT_DELAY_MS = 125;

async function verifyServerSession(): Promise<SessionVerifyResponse | null> {
  try {
    const res = await fetch("/api/admin/session/verify", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });
    if (res.status === 503) {
      return { ok: false, reason: "auth_misconfigured" };
    }
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

async function sessionEndpointMisconfigured(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
    if (res.status === 500) {
      const body = (await res.json().catch(() => ({}))) as { message?: string };
      return /configuration/i.test(body.message ?? "");
    }
    return false;
  } catch {
    return false;
  }
}

/** Wait until NextAuth client session and server-side backend token are both ready. */
export async function waitForAdminSessionReady(): Promise<
  { session: Session } | { session: null; failure: SessionWaitFailure }
> {
  if (await sessionEndpointMisconfigured()) {
    return { session: null, failure: "auth_misconfigured" };
  }

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
    try {
      const session = await getSession();
      if (session?.user?.id) {
        const verified = await verifyServerSession();
        if (verified?.ok) {
          return { session };
        }
        if (verified?.reason === "auth_misconfigured") {
          return { session: null, failure: "auth_misconfigured" };
        }
      }
    } catch (error) {
      if (isAuthConfigurationError(error)) {
        return { session: null, failure: "auth_misconfigured" };
      }
      logger.error("[admin][login] getSession failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, ATTEMPT_DELAY_MS));
  }

  logger.error("[admin][login] timed out waiting for admin session");
  return { session: null, failure: "timeout" };
}

export function resolvePostLoginTarget(session: Session | null, verify?: SessionVerifyResponse | null): string {
  const requiresMfaSetup =
    verify?.user?.requiresMfaSetup === true ||
    (session as { requiresMfaSetup?: boolean } | null)?.requiresMfaSetup === true;
  return requiresMfaSetup ? "/admin/security?setup=1" : "/admin";
}

export function sessionWaitFailureMessage(failure: SessionWaitFailure): string {
  switch (failure) {
    case "auth_misconfigured":
      return "Session could not be created: AUTH_SECRET is missing on Vercel Production (enable Production scope, not Preview-only), then redeploy.";
    case "verify_failed":
      return "Sign-in succeeded but the server could not verify your session. Try again or clear cookies for this site.";
    case "timeout":
    default:
      return "Sign-in succeeded but your session could not be saved. Clear site cookies for this domain, then try again.";
  }
}
