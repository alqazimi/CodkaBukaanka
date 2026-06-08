#!/usr/bin/env node
/** Generate cryptographically strong secrets for production env vars. */
import { randomBytes } from "node:crypto";

function hex(bytes = 32) {
  return randomBytes(bytes).toString("hex");
}

console.log(`
# Paste into Railway / Vercel (Production). Do NOT commit these values.

JWT_SECRET=${hex(32)}
AUTH_SECRET=${hex(32)}
TOTP_ENCRYPTION_KEY=${hex(32)}
ACTION_TOKEN_SECRET=${hex(32)}
`);
