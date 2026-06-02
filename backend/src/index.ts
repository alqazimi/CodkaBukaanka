import "dotenv/config";
import express, { type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { initRateLimitStore } from "./lib/rate-limit-store.js";
import { securityShield } from "./middleware/security-shield.js";
import { requireAdminIpAllowlist, requireDeleteActionToken, requireTrustedOrigin } from "./middleware/admin-hardening.js";

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
  throw new Error("Set FRONTEND_URL / FRONTEND_URLS to your Vercel URL in production (not localhost)");
}

if (isProduction || process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("Cache-Control", "no-store");
  if (isProduction) {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
  next();
});

const allowedOrigins = isProduction
  ? FRONTEND_URLS
  : [FRONTEND_URL, /^http:\/\/localhost:\d+$/];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowed = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      if (allowed) callback(null, true);
      else if (isProduction) callback(new Error("CORS not allowed"));
      else callback(null, FRONTEND_URL);
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());
app.use(securityShield);
app.use("/api/auth", requireTrustedOrigin);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "diiwaanka-bukaanka-api", version: "2.0.0" });
});

app.get("/", (_req, res) => {
  res.json({
    service: "Diiwaanka Bukaanka API",
    version: "2.0.0",
    description: "Medical Incident Intelligence Platform",
    health: "/health",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", requireAdminIpAllowlist, requireTrustedOrigin, requireDeleteActionToken, adminRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err: Error & { code?: string }, _req: Request, res: Response, _next: NextFunction) => {
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
