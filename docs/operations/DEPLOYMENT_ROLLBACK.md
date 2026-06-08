# Deployment rollback — CodkaBukaanka

## Frontend (Vercel)

1. Vercel → Project → **Deployments**
2. Find last **Ready** deployment before the bad one
3. ⋮ menu → **Promote to Production** (Instant Rollback)
4. Verify: `https://www.codkabukaanka.com/api/health`

Typical rollback time: **< 2 minutes**

## Backend (Railway)

1. Railway → backend service → **Deployments**
2. Select previous successful deployment → **Redeploy**
3. Verify: `https://diiwaanka-bukaanka-backend-production.up.railway.app/health`
4. Check logs for boot errors (strict env requirements)

Typical rollback time: **3–5 minutes**

## Database migrations

- Rollback **does not** reverse migrations automatically.
- If a bad migration shipped:
  1. Roll back app code first
  2. If schema incompatible, restore DB from backup (see BACKUP_RECOVERY.md)
  3. Never run `migrate reset` on production

## Git-based rollback

```bash
git revert <bad-commit-sha>
git push origin main
```

Vercel and Railway auto-deploy from `main` if connected.

## Post-rollback checklist

- [ ] `node scripts/verify-production.mjs` passes
- [ ] Admin login works
- [ ] Public homepage loads
- [ ] No 5xx spike in logs
