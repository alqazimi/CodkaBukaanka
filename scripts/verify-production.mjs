#!/usr/bin/env node
/**
 * Production launch gate — run after deploy:
 *   node scripts/verify-production.mjs
 *
 * Optional env overrides:
 *   SITE_URL=https://www.codkabukaanka.com
 *   API_URL=https://your-backend.up.railway.app
 */
const SITE = (process.env.SITE_URL ?? "https://www.codkabukaanka.com").replace(/\/$/, "");
const API = (process.env.API_URL ?? "https://diiwaanka-bukaanka-backend-production.up.railway.app").replace(/\/$/, "");

const failures = [];
const passes = [];

function pass(msg) {
  passes.push(msg);
  console.log(`  ✓ ${msg}`);
}

function fail(msg) {
  failures.push(msg);
  console.log(`  ✗ ${msg}`);
}

async function fetchHead(url) {
  const res = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(15000) });
  return res;
}

async function main() {
  console.log("\n=== CodkaBukaanka production verification ===\n");

  // Frontend
  try {
    const home = await fetchHead(`${SITE}/so`);
    if (home.ok) pass(`Frontend homepage ${SITE}/so → ${home.status}`);
    else fail(`Frontend homepage returned ${home.status}`);
    const hsts = home.headers.get("strict-transport-security");
    if (hsts?.includes("max-age")) pass("Frontend HSTS present");
    else fail("Frontend HSTS missing");
    const csp = home.headers.get("content-security-policy") ?? "";
    if (csp && !csp.includes("connect-src 'self' https:")) pass("Frontend CSP tightened (no blanket connect-src https:)");
    else if (csp.includes("connect-src") && csp.includes("https:") && csp.includes("https:;"))
      fail("Frontend CSP still allows blanket https: in connect-src — deploy latest code");
    else if (csp) pass("Frontend CSP present");
    else fail("Frontend CSP missing");
    const xfo = home.headers.get("x-frame-options");
    if (xfo?.toUpperCase() === "DENY") pass("Frontend X-Frame-Options: DENY");
    else fail("Frontend X-Frame-Options missing or weak");
  } catch (e) {
    fail(`Frontend unreachable: ${e instanceof Error ? e.message : e}`);
  }

  // Frontend health (requires latest deploy)
  try {
    const fh = await fetchHead(`${SITE}/api/health`);
    const ct = fh.headers.get("content-type") ?? "";
    if (!ct.includes("application/json")) {
      fail("Frontend /api/health not deployed yet — push latest code to Vercel");
    } else {
      const body = await fh.json();
      if (fh.ok && body.status === "ok") {
        pass(`Frontend /api/health → ok (api=${body.api}${body.apiHost ? `, host=${body.apiHost}` : ""})`);
        if (body.commit) pass(`Frontend deploy commit ${body.commit}`);
      } else {
        fail(
          `Frontend /api/health degraded: ${JSON.stringify(body)} — set API_URL on Vercel Production to Railway backend URL`
        );
      }
    }
  } catch (e) {
    fail(`Frontend /api/health unreachable: ${e instanceof Error ? e.message : e}`);
  }

  // Admin login page
  try {
    const admin = await fetchHead(`${SITE}/admin/login`);
    if (admin.ok) pass("Admin login page loads");
    else fail(`Admin login page returned ${admin.status}`);
  } catch (e) {
    fail(`Admin login unreachable: ${e instanceof Error ? e.message : e}`);
  }

  // Backend health
  try {
    const health = await fetchHead(`${API}/health`);
    const body = await health.json();
    if (health.ok && body.status === "ok") {
      pass(`Backend /health → ok`);
      if (body.rateLimit === "redis") pass("Backend rate limiting: Redis");
      else if (body.rateLimit === "memory") fail("Backend rateLimit=memory — set REDIS_URL on Railway");
      else fail("Backend missing rateLimit field — deploy latest backend + set REDIS_URL");
      if (body.db === "ok") pass("Backend database ping ok");
      else if (body.db === undefined) fail("Backend health missing db check — deploy latest backend");
      else fail("Backend database unavailable");
      if (body.commit) pass(`Backend deploy commit ${body.commit}`);
    } else {
      fail(`Backend health degraded: ${JSON.stringify(body)}`);
    }
    const bhsts = health.headers.get("strict-transport-security");
    if (bhsts) pass("Backend HSTS present");
    else fail("Backend HSTS missing");
  } catch (e) {
    fail(`Backend unreachable: ${e instanceof Error ? e.message : e}`);
  }

  // HTTP → HTTPS
  try {
    const http = await fetch(`http://www.codkabukaanka.com/so`, { redirect: "manual", signal: AbortSignal.timeout(10000) });
    if ([301, 302, 307, 308].includes(http.status)) pass("HTTP redirects to HTTPS");
    else fail(`HTTP redirect status unexpected: ${http.status}`);
  } catch (e) {
    fail(`HTTP redirect check failed: ${e instanceof Error ? e.message : e}`);
  }

  // Public API
  try {
    const stats = await fetchHead(`${API}/api/stats`);
    if (stats.ok) pass("Public /api/stats reachable");
    else fail(`Public /api/stats returned ${stats.status}`);
  } catch (e) {
    fail(`Public API unreachable: ${e instanceof Error ? e.message : e}`);
  }

  // Auth configuration (Vercel Production)
  try {
    const authCfg = await fetchHead(`${SITE}/api/auth/config-status`);
    const body = await authCfg.json();
    if (authCfg.ok && body.ready === true) pass("Auth configuration ready (AUTH_SECRET on Production)");
    else if (body.messages?.length) {
      const d = body.diagnostics;
      const detail = d
        ? ` [AUTH_SECRET set=${d.AUTH_SECRET_nonempty} len=${d.AUTH_SECRET_length} ok=${d.AUTH_SECRET_length_ok}; NEXTAUTH_SECRET set=${d.NEXTAUTH_SECRET_nonempty} len=${d.NEXTAUTH_SECRET_length}; VERCEL_ENV=${d.VERCEL_ENV ?? "n/a"}]`
        : "";
      fail(`Auth misconfigured: ${body.messages[0]}${detail}`);
    } else fail("Auth configuration not ready — set AUTH_SECRET on Vercel Production");
  } catch (e) {
    fail(`Auth config check failed: ${e instanceof Error ? e.message : e}`);
  }

  console.log(`\n--- Summary: ${passes.length} passed, ${failures.length} failed ---\n`);
  if (failures.length) {
    console.log("FAIL — launch blockers remain:\n");
    for (const f of failures) console.log(`  • ${f}`);
    process.exit(1);
  }
  console.log("PASS — all automated production checks passed.\n");
  console.log("Manual gates still required:");
  console.log("  • MFA enabled on every admin account (/admin/security)");
  console.log("  • AUTH_SECRET set on Vercel Production (not Preview-only)");
  console.log("  • UptimeRobot/Better Stack monitors configured");
  console.log("  • Sentry DSN configured (optional but recommended)");
  console.log("  • Postgres backup restore tested once on Railway\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
