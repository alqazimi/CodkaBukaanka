# Incident response — CodkaBukaanka

## Severity levels

| Level | Example | Response time |
|-------|---------|---------------|
| P1 | Site down, admin compromised | Immediate |
| P2 | API degraded, forms failing | < 1 hour |
| P3 | Single feature broken | < 24 hours |

## P1 — Site completely down

1. Check **UptimeRobot / Better Stack** alert — confirm from two locations.
2. **Vercel** → Deployments → latest status. If failed, **Instant Rollback** to last green deploy.
3. **Railway** → backend service → Deployments → redeploy last successful image.
4. Hit checks:
   - `https://www.codkabukaanka.com/api/health`
   - `https://diiwaanka-bukaanka-backend-production.up.railway.app/health`
5. If backend health shows `db: unavailable` → Railway Postgres status + connection string.
6. If backend won't start → Railway logs for boot errors (missing `REDIS_URL`, `CAPTCHA_*`, `ENFORCE_ADMIN_TOTP`, etc.).

## P1 — Suspected admin compromise

1. Railway → rotate `JWT_SECRET` immediately (invalidates all sessions).
2. Vercel → rotate `AUTH_SECRET` → redeploy frontend.
3. Disable affected admin in `/admin/admins` or set `active=false` in DB.
4. Review `audit` table for suspicious actions.
5. Force all admins to re-enroll MFA if TOTP secrets may be exposed.

## P2 — Login / forms failing

1. Verify Turnstile keys match (Vercel site key + Railway secret).
2. Check Redis connectivity if rate limits behave oddly.
3. Run `node scripts/verify-production.mjs` locally.

## Communication

- Document timeline, actions taken, and root cause in a private log.
- Do not post technical details publicly until resolved.

## Contacts

- **Owner:** (fill in)
- **Hosting:** Vercel support, Railway support
- **DNS/Security:** Cloudflare dashboard
