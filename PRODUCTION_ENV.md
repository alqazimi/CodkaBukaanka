# Production environment — CodkaBukaanka launch gate

**Public site:** https://www.codkabukaanka.com  
**Backend API:** https://diiwaanka-bukaanka-backend-production.up.railway.app

The backend **refuses to start** in production unless every required variable below is set.

---

## Railway (backend) — required

```env
NODE_ENV=production
PORT=8080
TRUST_PROXY=true

DATABASE_URL=<Railway Postgres reference>

JWT_SECRET=<48+ random hex — different from AUTH_SECRET>
ACTION_TOKEN_SECRET=<optional; defaults to JWT_SECRET>

FRONTEND_URL=https://www.codkabukaanka.com
FRONTEND_URLS=https://www.codkabukaanka.com,https://codkabukaanka.com

REDIS_URL=<redis://... from Railway Redis plugin>

CAPTCHA_VERIFY_URL=https://challenges.cloudflare.com/turnstile/v0/siteverify
CAPTCHA_SECRET=<Turnstile secret>

ENFORCE_ADMIN_TOTP=true
TOTP_ENCRYPTION_KEY=<48+ random hex>

CLOUDINARY_CLOUD_NAME=<value>
CLOUDINARY_API_KEY=<value>
CLOUDINARY_API_SECRET=<value>
USE_LOCAL_UPLOADS=false
```

### Add Redis on Railway

1. Railway project → **+ New** → **Database** → **Redis**
2. Copy `REDIS_URL` → backend service variables
3. Redeploy backend
4. Confirm `/health` returns `"rateLimit":"redis"`

---

## Vercel (frontend) — required

Apply to **Production** (not Preview-only):

> **Critical:** `AUTH_SECRET` on **Preview only** breaks live login at www.codkabukaanka.com — sessions cannot be created and users return to the login page after OTP.

```env
API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app
NEXT_PUBLIC_API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app

AUTH_URL=https://www.codkabukaanka.com
NEXT_PUBLIC_SITE_URL=https://www.codkabukaanka.com
NEXT_PUBLIC_CANONICAL_HOST=www.codkabukaanka.com

AUTH_SECRET=<48+ random hex>

NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Turnstile site key>
```

**Root Directory:** `frontend`

---

## Post-deploy verification

```bash
npm run verify:production
npm run load:smoke
```

Manual gates: MFA on all admins, UptimeRobot, backup restore test, Search Console if needed.

See `docs/operations/` for runbooks.
