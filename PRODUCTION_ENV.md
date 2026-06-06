# Connect Vercel frontend ↔ Railway backend

**Backend (Railway):** `https://diiwaanka-bukaanka-backend-production.up.railway.app`

## Railway (backend service)

```env
NODE_ENV=production
PORT=8080
TRUST_PROXY=true

DATABASE_URL=<reference from Postgres service>

JWT_SECRET=<64+ random hex>

FRONTEND_URL=https://www.codkabukaanka.com
FRONTEND_URLS=https://www.codkabukaanka.com,https://codkabukaanka.com,https://codka-bukaanka-frontend.vercel.app

ENFORCE_ADMIN_TOTP=true

CLOUDINARY_CLOUD_NAME=<your value>
CLOUDINARY_API_KEY=<your value>
CLOUDINARY_API_SECRET=<your value>
```

Do **not** set `FRONTEND_URL` to `localhost` in production.

## Vercel (frontend project)

```env
API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app
NEXT_PUBLIC_API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app

AUTH_URL=https://www.codkabukaanka.com
NEXT_PUBLIC_SITE_URL=https://www.codkabukaanka.com

AUTH_SECRET=<64+ random hex, different from JWT_SECRET is OK>
```

Apply to **Production** (and Preview if you use preview deploys). Redeploy after saving.

**Important:** URLs must include `https://` (e.g. `https://diiwaanka-bukaanka-backend-production.up.railway.app`). If you omit the scheme, the app will auto-add `https://` — but using the full URL in Vercel is recommended.

**Vercel project settings (monorepo):**

- **Root Directory:** `frontend` (or rely on `frontend/vercel.json` install command)
- **Install:** `cd .. && npm install` (default from `frontend/vercel.json`)
- **Build:** `npm run build`

Without `API_URL`, `NEXT_PUBLIC_API_URL`, and `AUTH_SECRET`, the deploy may **build** but admin login and live data will not work until those variables are set.

## Admin login (important)

- **Do not** log in at the Railway URL (`diiwaanka-bukaanka-backend-production.up.railway.app`) — that is the API only.
- Use **production site**: `https://www.codkabukaanka.com/admin/login`
- Somali homepage: `https://www.codkabukaanka.com/so` (default locale)
- First production login: email + password only → you are sent to **Admin → Security** to enable Authenticator (TOTP). After that, use the 6-digit code every time.

## Verify

1. [Backend health](https://diiwaanka-bukaanka-backend-production.up.railway.app/health) → `{"status":"ok",...}`
2. Open [https://www.codkabukaanka.com/so](https://www.codkabukaanka.com/so) — public pages load data
3. [https://www.codkabukaanka.com/admin/login](https://www.codkabukaanka.com/admin/login) — login works

## Local dev

Keep `backend/.env` and `frontend/.env` with `localhost` URLs; production uses hosting dashboards only.
