import jwt from "jsonwebtoken";

type ActionScope = "admin:delete";

type ActionTokenPayload = {
  sub: string;
  scope: ActionScope;
  iat?: number;
  exp?: number;
};

const ACTION_TOKEN_TTL_SEC = 60;
const JWT_OPTIONS = { algorithms: ["HS256" as const] };

export function signActionToken(adminId: string, scope: ActionScope): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  return jwt.sign({ sub: adminId, scope }, secret, {
    expiresIn: ACTION_TOKEN_TTL_SEC,
    algorithm: "HS256",
  });
}

export function verifyActionToken(token: string, adminId: string, scope: ActionScope): boolean {
  const secret = process.env.JWT_SECRET;
  if (!secret) return false;
  try {
    const payload = jwt.verify(token, secret, JWT_OPTIONS) as ActionTokenPayload;
    return payload.sub === adminId && payload.scope === scope;
  } catch {
    return false;
  }
}
