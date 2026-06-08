# Launch gate report — CodkaBukaanka

**Automated check:** `npm run verify:production`  
**Last run:** After code push — re-run after Railway/Vercel env updates.

## PASS criteria (all required)

- [ ] Latest code deployed to Vercel + Railway
- [ ] `REDIS_URL` set — `/health` shows `"rateLimit":"redis"`
- [ ] `ENFORCE_ADMIN_TOTP=true` + all admins enrolled in MFA
- [ ] `AUTH_SECRET` on Vercel **Production**
- [ ] `npm run verify:production` exits 0
- [ ] Backup restore tested (log in BACKUP_RECOVERY.md)
- [ ] UptimeRobot monitors active
- [ ] No critical Safe Browsing flag on www domain

## Current status: **FAIL**

Production is on commit `f6ed0ee` or earlier. Local repo has security hardening + launch gate not yet pushed/deployed.

### Blockers to close in hosting dashboards

1. **Railway:** Add Redis → `REDIS_URL`
2. **Railway:** `ENFORCE_ADMIN_TOTP=true`, `TOTP_ENCRYPTION_KEY`
3. **Railway:** Remove `*.vercel.app` from `FRONTEND_URLS`
4. **Vercel:** `AUTH_SECRET` on Production
5. **Git push** latest commits → auto-deploy
6. **MFA:** Enable for every admin account
7. **Monitoring:** UptimeRobot + optional Sentry
8. **Backup:** One test restore documented

## Scores (after blockers closed)

| Category | Target | Current |
|----------|--------|---------|
| Security | 95+ | Blocked until MFA + Redis + deploy |
| Reliability | 95+ | Blocked until monitoring + backup test |
| Scalability | 95+ | Blocked until Redis |
| Operations | 95+ | Runbooks added; monitoring pending |
| Launch readiness | 95+ | **FAIL** |

See `PRODUCTION_ENV.md` and `docs/operations/`.
