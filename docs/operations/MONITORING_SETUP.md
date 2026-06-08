# Monitoring setup — CodkaBukaanka

## 1. UptimeRobot (free tier)

Create monitors:

| Name | URL | Interval |
|------|-----|----------|
| Frontend home | `https://www.codkabukaanka.com/so` | 5 min |
| Frontend health | `https://www.codkabukaanka.com/api/health` | 5 min |
| Backend health | `https://diiwaanka-bukaanka-backend-production.up.railway.app/health` | 5 min |
| Admin login | `https://www.codkabukaanka.com/admin/login` | 15 min |

Alert contacts: email + SMS for owner.

**Keyword check (optional):** Frontend health body contains `"status":"ok"`

## 2. Better Stack (alternative)

- Heartbeat on `/api/health` and backend `/health`
- Log tail from Railway → Better Stack source
- Alert on 5xx rate > 1% over 5 minutes

## 3. Sentry (error tracking)

### Frontend (Vercel)

1. Create project at sentry.io → Next.js
2. Vercel → Environment Variables:
   ```env
   SENTRY_DSN=https://...@....ingest.sentry.io/...
   NEXT_PUBLIC_SENTRY_DSN=<same or public key>
   SENTRY_AUTH_TOKEN=<for source maps upload — optional>
   ```
3. Install when ready: `npm install @sentry/nextjs -w frontend` and run `@sentry/wizard`

### Backend (Railway)

```env
SENTRY_DSN=https://...@....ingest.sentry.io/...
```

Install when ready: `npm install @sentry/node -w backend` and init in `index.ts`.

Until Sentry packages are added, rely on Railway + Vercel log drains.

## 4. Railway log alerts

Railway → backend service → **Observability** → alert on deployment failure and high restart count.

## 5. Weekly automated check

```bash
npm run verify:production
npm run load:smoke
```

Add to CI or calendar reminder.

## Alert runbook

| Alert | Action |
|-------|--------|
| Site down | INCIDENT_RESPONSE.md P1 |
| API degraded | Check Railway logs + `/health` JSON |
| Login failures spike | Check Turnstile, Redis, brute-force logs |
| 5xx spike | Rollback or scale Railway |
