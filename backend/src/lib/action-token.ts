import jwt from "jsonwebtoken";
import { randomUUID } from "node:crypto";
import { getRateKey, incrementRateKey } from "./rate-limit-store.js";

export type ActionScope = "admin:destructive";

type ActionTokenPayload = {
  sub: string;
  scope: ActionScope;
  jti: string;
  fp?: string;
  iat?: number;
  exp?: number;
};

const ACTION_TOKEN_TTL_SEC = 60;
const JWT_OPTIONS = { algorithms: ["HS256" as const] };

function actionTokenSecret(): string {
  return process.env.ACTION_TOKEN_SECRET?.trim() || process.env.JWT_SECRET?.trim() || "";
}

export function signActionToken(adminId: string, scope: ActionScope, fingerprint?: string): string {
  const secret = actionTokenSecret();
  if (!secret) throw new Error("JWT_SECRET not set");
  const jti = randomUUID();
  return jwt.sign({ sub: adminId, scope, jti, fp: fingerprint }, secret, {
    expiresIn: ACTION_TOKEN_TTL_SEC,
    algorithm: "HS256",
  });
}

export async function consumeActionToken(
  token: string,
  adminId: string,
  scope: ActionScope,
  fingerprint?: string
): Promise<boolean> {
  const secret = actionTokenSecret();
  if (!secret) return false;
  try {
    const payload = jwt.verify(token, secret, JWT_OPTIONS) as ActionTokenPayload;
    if (payload.sub !== adminId || payload.scope !== scope || !payload.jti) return false;
    if (fingerprint && payload.fp && payload.fp !== fingerprint) return false;

    const usedKey = `action-jti:${payload.jti}`;
    const used = await getRateKey(usedKey);
    if (used.count > 0) return false;

    await incrementRateKey(usedKey, ACTION_TOKEN_TTL_SEC * 1000);
    return true;
  } catch {
    return false;
  }
}

/** @deprecated Use consumeActionToken — kept for sync call sites during migration */
export function verifyActionToken(token: string, adminId: string, scope: ActionScope): boolean {
  const secret = actionTokenSecret();
  if (!secret) return false;
  try {
    const payload = jwt.verify(token, secret, JWT_OPTIONS) as ActionTokenPayload;
    return payload.sub === adminId && payload.scope === scope;
  } catch {
    return false;
  }
}

export function buildActionFingerprint(method: string, path: string): string {
  return `${method.toUpperCase()}:${path}`;
}
