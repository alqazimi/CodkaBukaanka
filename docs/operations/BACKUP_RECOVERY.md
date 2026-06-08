# Backup and recovery — CodkaBukaanka

## RPO / RTO targets

| Metric | Target |
|--------|--------|
| **RPO** (max data loss) | 24 hours (Railway Postgres daily backup) |
| **RTO** (max downtime) | 4 hours (manual restore + verify) |

## Verify backups exist (Railway)

1. Railway dashboard → **Postgres** service (not the Node app).
2. **Backups** tab → confirm automated backups enabled.
3. Note retention period and last backup timestamp.

**Do not assume backups work until you complete a test restore.**

## Test restore procedure (required once before launch)

### Option A — Restore to new Railway Postgres (safest)

1. Create a **new** Postgres instance on Railway (staging).
2. From source backup, restore into staging (Railway UI or `pg_restore`).
3. Point a **staging** backend at staging `DATABASE_URL`.
4. Run `npx prisma migrate deploy`
5. Verify `/health` returns `db: ok` and public stats load.
6. Document date and operator name below.

### Option B — Export/import drill

1. Export: `pg_dump $DATABASE_URL > backup-test.sql`
2. Import to local or staging empty DB: `psql $STAGING_URL < backup-test.sql`
3. Verify row counts for `Case`, `Admin`, `Evidence`.

## Recovery evidence log

| Date | Operator | Method | Result |
|------|----------|--------|--------|
| _fill after test_ | | | |

## Production disaster restore (real incident)

1. Stop backend service (prevent writes during restore).
2. Restore Postgres from latest clean backup.
3. Redeploy backend with same `DATABASE_URL` (or updated if new instance).
4. Run `npm run db:deploy -w backend` if migrations pending.
5. Verify `/health`, homepage, admin login.
6. Re-enable traffic.

## What is NOT backed up

- **Cloudinary** media — retained by Cloudinary (verify account backup policy).
- **Redis** — ephemeral (rate limit counters only; safe to lose).
- **Railway local disk** — never used in production (`USE_LOCAL_UPLOADS=false`).
