# Connect Vercel frontend ↔ Railway backend

**Backend (Railway):** `https://diiwaanka-bukaanka-backend-production.up.railway.app`

## Chrome “Dangerous site” (must do once)

If visitors see a red Chrome warning, the domain may be on Google Safe Browsing. Code and headers help prevent false flags, but **only Google can clear an existing flag**:

1. Open [Google Search Console](https://search.google.com/search-console) → add property **`https://www.codkabukaanka.com`**
2. Go to **Security issues** → if any issue is listed, click **Request review** after deploy
3. Check status: [Google Safe Browsing transparency report](https://transparencyreport.google.com/safe-browsing/search?url=https://www.codkabukaanka.com)
4. Always share **`https://www.codkabukaanka.com`** — not old Vercel preview URLs

Set on Vercel (Production):

```env
NEXT_PUBLIC_CANONICAL_HOST=www.codkabukaanka.com
NEXT_PUBLIC_SITE_URL=https://www.codkabukaanka.com
```

## Railway (backend service)

```env
NODE_ENV=production
PORT=8080
TRUST_PROXY=true

DATABASE_URL=<reference from Postgres service>

JWT_SECRET=<64+ random hex>

FRONTEND_URL=https://www.codkabukaanka.com
FRONTEND_URLS=https://www.codkabukaanka.com,https://codkabukaanka.com,https://codka-bukaanka-frontend.vercel.app

# Optional — set to true only if you want owner authenticator app at login
ENFORCE_ADMIN_TOTP=false

CLOUDINARY_CLOUD_NAME=<your value>
CLOUDINARY_API_KEY=<your value>
CLOUDINARY_API_SECRET=<your value>

# Keep evidence on Cloudinary in production (Railway disk is ephemeral)
USE_LOCAL_UPLOADS=false

CAPTCHA_VERIFY_URL=https://challenges.cloudflare.com/turnstile/v0/siteverify
CAPTCHA_SECRET=<Turnstile secret key from Cloudflare dashboard>
```

Do **not** set `FRONTEND_URL` to `localhost` in production.

## Vercel (frontend project)

```env
API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app
NEXT_PUBLIC_API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app

AUTH_URL=https://www.codkabukaanka.com
NEXT_PUBLIC_SITE_URL=https://www.codkabukaanka.com
NEXT_PUBLIC_CANONICAL_HOST=www.codkabukaanka.com

AUTH_SECRET=<64+ random hex, different from JWT_SECRET is OK>

NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Turnstile site key from Cloudflare dashboard>
```

Apply to **Production** (and Preview if you use preview deploys). Redeploy after saving.

**Important:** URLs must include `https://` (e.g. `https://diiwaanka-bukaanka-backend-production.up.railway.app`). If you omit the scheme, the app will auto-add `https://` — but using the full URL in Vercel is recommended.

**Vercel project settings (monorepo):**

- **Root Directory:** `frontend` (or rely on `frontend/vercel.json` install command)
- **Install:** `cd .. && npm install` (default from `frontend/vercel.json`)
- **Build:** `npm run build`

Without `API_URL`, `NEXT_PUBLIC_API_URL`, and `AUTH_SECRET`, the deploy may **build** but admin login and live data will not work until those variables are set.

## Admin login (important)

- **Do not** log in at the Railway URL — that is the API only.
- Use **production site**: `https://www.codkabukaanka.com/admin/login`
- Somali homepage: `https://www.codkabukaanka.com/so` (default locale)
- Login is **email + password only** (no authenticator app unless you set `ENFORCE_ADMIN_TOTP=true` on Railway).
- Admin sessions end after **3 hours**; sign in again when prompted.

### After each backend deploy with new migrations

On Railway (backend service shell or one-off command):

```bash
npx prisma migrate deploy
```

Latest deploy includes performance indexes (`20260607120000_perf_indexes`).

### Evidence photos missing on the public site?

Older uploads may have been saved to Railway’s temporary disk (`local/…` files). Those files are **lost after redeploy**. Fix:

1. Set `USE_LOCAL_UPLOADS=false` on Railway (with Cloudinary keys set).
2. In admin, open each affected case → remove broken evidence → upload again (files go to Cloudinary and persist).

### Cloudflare Turnstile (required for production admin login)

After a few failed attempts or signing in from a new device, the server requires a captcha. Without Turnstile keys, login can get stuck on “Additional verification is required.”

1. In [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Turnstile** → **Add site** (widget mode: Managed).
2. Add your domains: `www.codkabukaanka.com`, `codkabukaanka.com`.
3. Copy **Site key** → Vercel `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
4. Copy **Secret key** → Railway `CAPTCHA_SECRET` (and keep `CAPTCHA_VERIFY_URL` as above).
5. Redeploy **both** Vercel and Railway.

If someone is locked out after wrong passwords, wait 15–30 minutes or clear Redis login counters on Railway.

## Verify

1. [Backend health](https://diiwaanka-bukaanka-backend-production.up.railway.app/health) → `{"status":"ok",...}`
2. Open [https://www.codkabukaanka.com/so](https://www.codkabukaanka.com/so) — public pages load data
3. [https://www.codkabukaanka.com/admin/login](https://www.codkabukaanka.com/admin/login) — login works

## Local dev

Keep `backend/.env` and `frontend/.env` with `localhost` URLs; production uses hosting dashboards only.
