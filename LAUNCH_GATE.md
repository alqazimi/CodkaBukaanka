# Launch gate report — CodkaBukaanka

**Date:** 2026-06-08  
**Automated check:** `npm run verify:production`  
**Expected repo commit:** `8d4525e` (launch gate hardening) + follow-up deploy fixes

---

## Final verdict: **FAIL** (launch blocked)

Code, runbooks, and verification tooling are in place. Production **cannot pass** until Railway and Vercel dashboard configuration is completed. The backend **will not boot** with the latest code until Redis, MFA enforcement, Turnstile, and Cloudinary env vars are set.

---

## Phase summary

| Phase | Status | Evidence |
|-------|--------|----------|
| 1 — Deployment verification | **PARTIAL** | Frontend on latest (`CSP` tightened, `/api/health` live). Backend still on pre-launch-gate build (`{"status":"ok"}` only). |
| 2 — Auth hardening | **CODE DONE / INFRA PENDING** | `ENFORCE_ADMIN_TOTP` enforced at boot; MFA enrollment required per admin |
| 3 — Secrets validation | **CANNOT VERIFY** | No dashboard access; use `npm run secrets:generate` + `PRODUCTION_ENV.md` |
| 4 — Redis / rate limiting | **BLOCKED** | `/health` missing `rateLimit` — add Railway Redis + `REDIS_URL` |
| 5 — Monitoring | **PARTIAL** | Sentry packages installed (DSN optional); UptimeRobot not configured |
| 6 — Backup / recovery | **NOT TESTED** | Procedure in `BACKUP_RECOVERY.md`; evidence log empty |
| 7 — WAF / DDoS | **DOCUMENTED** | `docs/operations/CLOUDFLARE_WAF.md` — Cloudflare rules not verified |
| 8 — Cloud security | **PASS (code)** | No debug endpoints; source maps off; admin proxy allowlist |
| 9 — Security headers | **PASS (frontend)** | HSTS, CSP (tightened), X-Frame-Options DENY |
| 10 — Load testing | **PASS (smoke)** | 100/100 homepage + API stats @ concurrency 20 |
| 11 — Database | **PARTIAL** | Migrations via Railway preDeploy; restore untested |
| 12 — Frontend health | **PASS (code)** | Mobile menu fix deployed |
| 13 — Domain reputation | **NOT VERIFIED** | Check Google Safe Browsing manually |
| 14 — Production ops | **PASS (docs)** | Runbooks in `docs/operations/` |
| 15 — Launch gate | **FAIL** | See blockers below |

---

## Automated verification (last run)

```
8 passed → 9 passed after frontend deploy
3 failed:
  • Frontend /api/health degraded (Vercel API_URL likely wrong — set to Railway URL)
  • Backend missing rateLimit field (old deploy + no Redis)
  • Backend health missing db check (old deploy)
```

**Load smoke:** 100/100 ok on homepage, `/api/stats`, health endpoints (~250–400ms avg).

---

## Remaining blockers (hosting dashboards — required)

### Railway (backend) — do in this order

1. **Add Redis** → copy `REDIS_URL` to backend service variables  
2. Set `ENFORCE_ADMIN_TOTP=true`  
3. Set `TOTP_ENCRYPTION_KEY` (32+ chars) — `npm run secrets:generate`  
4. Set `CAPTCHA_SECRET` + `CAPTCHA_VERIFY_URL` (Turnstile)  
5. Set Cloudinary vars + `USE_LOCAL_UPLOADS=false`  
6. **Remove** `*.vercel.app` from `FRONTEND_URLS`  
7. Redeploy backend → confirm `/health` returns:
   ```json
   {"status":"ok","db":"ok","rateLimit":"redis","commit":"..."}
   ```

### Vercel (frontend)

1. Set `API_URL` and `NEXT_PUBLIC_API_URL` to Railway backend URL (**Production** scope)  
2. Set `AUTH_SECRET` (32+ chars) on **Production** (not Preview-only)  
3. Optional: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`  
4. Redeploy → `/api/health` should return `"status":"ok","api":"ok"`

### Manual gates

- [ ] MFA enabled for **every** admin at `/admin/security`  
- [ ] UptimeRobot monitors (see `MONITORING_SETUP.md`)  
- [ ] Postgres backup restore test logged in `BACKUP_RECOVERY.md`  
- [ ] Cloudflare WAF rules if DNS proxied through Cloudflare  

---

## Scores

| Category | Score | Notes |
|----------|-------|-------|
| **Security** | 93 | Code hardened; blocked on Redis, MFA live, secrets |
| **Reliability** | 78 | No monitoring alerts; backup restore untested |
| **Scalability** | 82 | Redis required for distributed rate limits at 1M+ users |
| **Maintainability** | 96 | Runbooks, verify scripts, strict boot checks |
| **Operations** | 85 | Docs complete; monitoring/restore pending |
| **Launch readiness** | **74 — FAIL** | Infra blockers above |

Target **95+** requires closing all blockers and `npm run verify:production` exiting 0.

---

## What was fixed in code (this session)

- Pushed `8d4525e` launch gate to `origin/main`  
- Frontend deployed: tightened CSP, `/api/health` endpoint  
- Sentry hooks (`@sentry/nextjs`, `@sentry/node`) — active when `SENTRY_DSN` set  
- Health probe tries both `API_URL` and `NEXT_PUBLIC_API_URL`  
- Deploy commit SHA in health JSON for verification  
- `npm run secrets:generate` for production secret generation  

See `PRODUCTION_ENV.md`, `SECURITY_AUDIT.md`, and `docs/operations/` for full detail.
