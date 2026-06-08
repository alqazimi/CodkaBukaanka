import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { initRateLimitStore, getRateLimitStoreKind } from "./lib/rate-limit-store.js";
import { securityShield } from "./middleware/security-shield.js";
import { requireAdminIpAllowlist, requireTrustedOrigin } from "./middleware/admin-hardening.js";
import { isOriginAllowed, normalizeSiteOrigin, parseFrontendOrigins } from "./lib/origin-utils.js";
import { isCaptchaConfigured } from "./lib/captcha.js";
import { isCloudinaryConfigured } from "./lib/cloudinary.js";
import { prisma } from "./lib/prisma.js";
import { getBuildCommit } from "./lib/build-info.js";
import { initSentry } from "./lib/sentry.js";

await initSentry();

initRateLimitStore();

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3000";
const FRONTEND_URLS = (process.env.FRONTEND_URLS ?? FRONTEND_URL)
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);
const isProduction = process.env.NODE_ENV === "production";
const JWT_SECRET = process.env.JWT_SECRET ?? "";

if (isProduction && JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be at least 32 characters in production");
}

if (isProduction && FRONTEND_URLS.some((u) => /localhost|127\.0\.0\.1/i.test(u))) {
  throw new Error("Set FRONTEND_URL / FRONTEND_URLS to your production domain in production (not localhost)");
}

if (isProduction && FRONTEND_URLS.some((u) => /\.vercel\.app/i.test(u))) {
  throw new Error("Remove *.vercel.app from FRONTEND_URLS in production — use www.codkabukaanka.com only");
}

if (isProduction && !process.env.REDIS_URL?.trim()) {
  throw new Error("REDIS_URL is required in production for distributed rate limiting (add Railway Redis plugin)");
}

if (isProduction && !isCaptchaConfigured()) {
  throw new Error(
    "CAPTCHA_SECRET and CAPTCHA_VERIFY_URL must be set in production (Turnstile required for login and public forms)"
  );
}

if (isProduction && process.env.ENFORCE_ADMIN_TOTP !== "true") {
  throw new Error("ENFORCE_ADMIN_TOTP=true is required in production");
}

if (isProduction && process.env.USE_LOCAL_UPLOADS === "true") {
  throw new Error("USE_LOCAL_UPLOADS must be false in production — use Cloudinary");
}

if (isProduction && !isCloudinaryConfigured()) {
  throw new Error("CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required in production");
}

const enforceAdminTotp = process.env.ENFORCE_ADMIN_TOTP === "true";
const totpKey = process.env.TOTP_ENCRYPTION_KEY?.trim() ?? "";
if (isProduction && enforceAdminTotp && totpKey.length < 32) {
  throw new Error(
    "TOTP_ENCRYPTION_KEY must be at least 32 characters in production (encrypts authenticator secrets at rest)"
  );
}

if (isProduction || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  if (!req.path.startsWith("/api/evidence/stream/")) {
    res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  }
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("Cache-Control", "no-store");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  }
  next();
});

const allowedOriginList = isProduction
  ? parseFrontendOrigins(FRONTEND_URL, process.env.FRONTEND_URLS ?? FRONTEND_URL)
  : parseFrontendOrigins(FRONTEND_URL).concat(
      Array.from({ length: 10 }, (_, i) => `http://localhost:${3000 + i}`)
    );

const allowedOrigins = isProduction
  ? allowedOriginList
  : [FRONTEND_URL, /^http:\/\/localhost:\d+$/];

function corsOriginAllowed(origin: string): boolean {
  if (isProduction) {
    return isOriginAllowed(origin, allowedOriginList);
  }
  return allowedOrigins.some((o) =>
    typeof o === "string" ? normalizeSiteOrigin(o) === normalizeSiteOrigin(origin) : o.test(origin)
  );
}

/** Server-side admin/auth proxy uses Bearer tokens — skip browser CORS (avoids false 500s). */
function shouldBypassCors(req: Request): boolean {
  const auth = req.headers.authorization;
  if (typeof auth !== "string" || !auth.startsWith("Bearer ")) return false;
  return req.path.startsWith("/api/admin") || req.path === "/api/auth/login";
}

const corsMiddleware = cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true);
      return;
    }
    if (corsOriginAllowed(origin)) {
      callback(null, true);
      return;
    }
    // Never throw here — Express turns it into HTTP 500 on server-side proxy requests.
    callback(null, false);
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-admin-action-token"],
});

app.use((req, res, next) => {
  if (shouldBypassCors(req)) {
    next();
    return;
  }
  corsMiddleware(req, res, next);
});
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(securityShield);
app.use("/api/auth", requireTrustedOrigin);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    res.status(503).json({ status: "degraded", db: "unavailable" });
    return;
  }

  const payload: Record<string, string> = {
    status: "ok",
    db: "ok",
    rateLimit: getRateLimitStoreKind(),
  };

  const commit = getBuildCommit();
  if (commit) payload.commit = commit.slice(0, 12);

  if (!isProduction) {
    payload.service = "diiwaanka-bukaanka-api";
    payload.version = "2.0.0";
  }

  res.json(payload);
});

app.get("/", (_req, res) => {
  if (isProduction) {
    res.json({ status: "ok" });
    return;
  }
  res.json({
    service: "Diiwaanka Bukaanka API",
    version: "2.0.0",
    description: "Medical Incident Intelligence Platform",
    health: "/health",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", requireAdminIpAllowlist, requireTrustedOrigin, adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error & { code?: string }, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    if (isProduction) {
      res.status(400).json({ error: "Validation failed" });
    } else {
      res.status(400).json({ error: "Validation failed", details: err.flatten().fieldErrors });
    }
    return;
  }
  console.error("API error:", err.message);
  const dbUnavailableCodes = new Set(["P1000", "P1001", "P1002", "P1008", "P1017"]);
  const isDbUnavailable =
    (err.code ? dbUnavailableCodes.has(err.code) : false) ||
    /can't reach database server|database.*unavailable|connection.+(refused|timed out)/i.test(err.message);
  res.status(isDbUnavailable ? 503 : 500).json({
    error: isDbUnavailable ? "Database unavailable" : "Internal server error",
    message: process.env.NODE_ENV !== "production" ? err.message : undefined,
  });
});

const server = app.listen(PORT, () => {
  console.log(`API server listening on port ${PORT}`);
  if (isProduction) {
    console.log(`CORS allowed origins: ${FRONTEND_URLS.join(", ")}`);
  }
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `\nPort ${PORT} is already in use.\n` +
        `  • Run backend only once (from project root: npm run dev, OR from backend/: npm run dev — not both).\n` +
        `  • Or stop the other process: netstat -ano | findstr :${PORT}  then  taskkill /PID <pid> /F\n`
    );
    process.exit(1);
  }
  throw err;
});
