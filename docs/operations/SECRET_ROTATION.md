# Secret rotation — CodkaBukaanka

Rotate immediately if a secret was exposed (chat, screenshot, commit, log leak).

## Rotation schedule

| Secret | Where | Frequency |
|--------|-------|-----------|
| `JWT_SECRET` | Railway | Quarterly or on incident |
| `AUTH_SECRET` | Vercel Production | Quarterly or on incident |
| `CAPTCHA_SECRET` | Railway | On Cloudflare key rotation |
| `TOTP_ENCRYPTION_KEY` | Railway | Only with MFA re-enrollment plan |
| `CLOUDINARY_API_SECRET` | Railway + Cloudinary | Quarterly |
| `DATABASE_URL` password | Railway Postgres | Quarterly |

## JWT_SECRET (Railway)

1. Generate: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
2. Railway → Variables → update `JWT_SECRET`
3. Redeploy backend — **all admin sessions invalidated**
4. Admins sign in again

## AUTH_SECRET (Vercel)

1. Generate new 48+ char hex (different from JWT_SECRET).
2. Vercel → Settings → Environment Variables → **Production** → `AUTH_SECRET`
3. Redeploy frontend
4. All NextAuth sessions invalidated

## CAPTCHA_SECRET

1. Cloudflare Turnstile → rotate secret key
2. Update Railway `CAPTCHA_SECRET`
3. Redeploy backend (no user impact if site key unchanged)

## TOTP_ENCRYPTION_KEY

**Warning:** Changing this without re-enrolling MFA breaks existing TOTP secrets.

1. Set `ENFORCE_ADMIN_TOTP=false` temporarily (dev/staging only — avoid in prod if possible)
2. Or: have every admin disable and re-setup MFA in `/admin/security`
3. Update key → redeploy → re-enroll all admins

## After rotation

- [ ] Verify admin login
- [ ] Verify public forms (contact, submit case)
- [ ] Run `node scripts/verify-production.mjs`
