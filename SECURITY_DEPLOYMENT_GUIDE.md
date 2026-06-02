# Security Deployment Guide (Production)

This guide is intentionally written without real credentials or private infrastructure details.
Use it to deploy safely without exposing sensitive information in code, logs, or git history.

## 1) Secret handling rules

- Never commit real values for:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `AUTH_SECRET`
  - `CLOUDINARY_*`
  - `REDIS_URL`
- Keep secrets only in hosting secret managers (Vercel/Railway/Render/Fly/etc).
- Rotate secrets immediately if they were ever pasted into chat, logs, or tracked files.

## 2) Required backend production env

- `NODE_ENV=production`
- `PORT=4000`
- `DATABASE_URL=<managed-postgres-connection>`
- `JWT_SECRET=<minimum 32 random chars>`
- `FRONTEND_URLS=https://your-domain.com,https://admin.your-domain.com`
- `ENFORCE_ADMIN_TOTP=true`
- `TRUST_PROXY=true` (when behind CDN/reverse proxy)
- `REDIS_URL=<redis-connection>` (recommended)
- `CLOUDINARY_CLOUD_NAME=<value>`
- `CLOUDINARY_API_KEY=<value>`
- `CLOUDINARY_API_SECRET=<value>`

## 3) Required frontend production env

- `API_URL=https://your-api-domain.com`
- `NEXT_PUBLIC_API_URL=https://your-api-domain.com`
- `AUTH_URL=https://your-frontend-domain.com`
- `AUTH_SECRET=<minimum 32 random chars>`
- `NEXT_PUBLIC_SITE_URL=https://your-frontend-domain.com`

## 4) First deploy sequence

1. Deploy backend with secrets.
2. Run migrations:
   - `npm run db:deploy -w backend`
3. Seed only if needed:
   - `npm run db:seed -w backend`
4. Deploy frontend with production URLs and `AUTH_SECRET`.
5. Verify health endpoint:
   - `GET /health` returns status `ok`.

## 5) Security validation before go-live

- Admin login requires password + TOTP.
- New admin onboarding uses controlled process and enables MFA before normal usage.
- Session timeout policy is active (idle + max session).
- Rate limiting and lockout behavior works.
- Public APIs do not expose draft/private admin-only data.
- Owner-only routes are inaccessible to non-owner admins.

## 6) Attack surface hardening checklist

- CORS allowlist includes only your exact domains.
- HTTPS enforced at edge/load balancer.
- WAF/CDN protection enabled (rate limiting, bot filtering, geo/ASN rules as needed).
- Cloudinary upload restrictions validated (mime and size limits).
- Database account has least privilege (no superuser rights for app user).
- Backups are automated and restore tested.

## 7) Logging and monitoring

- Alert on:
  - repeated login failures
  - account lockout spikes
  - sudden 5xx spikes
  - unusual admin actions
- Keep audit logs retained and access-controlled.
- Do not log secrets, raw tokens, or full credential payloads.

## 8) Git safety policy

- `.env` and secret-like files must stay ignored.
- Never commit key files, dumps, or credential JSON.
- If a secret is committed by mistake:
  1. rotate it immediately
  2. remove exposure from history using your repo policy
  3. redeploy with new secrets

## 9) Post-deploy quick smoke tests

- Public pages load.
- Admin login works with MFA.
- Create/update/delete in admin works.
- Contact/corrections forms work and spam checks block bad payloads.
- Build and health checks pass.

## 10) Ongoing operations

- Run `SECURITY_WEEKLY_CHECKLIST.md` every week.
- Patch dependencies monthly (or sooner for high/critical advisories).
- Rotate secrets quarterly (or immediately after any incident).
