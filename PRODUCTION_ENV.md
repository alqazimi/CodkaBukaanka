# Connect Vercel frontend ↔ Railway backend

Replace `YOUR-BACKEND.up.railway.app` with your Railway **public** backend URL.

## Railway (backend service)

```env
NODE_ENV=production
PORT=8080
TRUST_PROXY=true

DATABASE_URL=<reference from Postgres service>

JWT_SECRET=<64+ random hex>

FRONTEND_URL=https://codka-bukaanka-frontend.vercel.app
FRONTEND_URLS=https://codka-bukaanka-frontend.vercel.app

ENFORCE_ADMIN_TOTP=true

CLOUDINARY_CLOUD_NAME=<your value>
CLOUDINARY_API_KEY=<your value>
CLOUDINARY_API_SECRET=<your value>
```

Do **not** set `FRONTEND_URL` to `localhost` in production.

## Vercel (frontend project)

```env
API_URL=https://YOUR-BACKEND.up.railway.app
NEXT_PUBLIC_API_URL=https://YOUR-BACKEND.up.railway.app

AUTH_URL=https://codka-bukaanka-frontend.vercel.app
NEXT_PUBLIC_SITE_URL=https://codka-bukaanka-frontend.vercel.app

AUTH_SECRET=<64+ random hex, different from JWT_SECRET is OK>
```

Apply to **Production** (and Preview if you use preview deploys). Redeploy after saving.

## Admin login (important)

- **Do not** log in at the Railway URL (`diiwaanka-bukaanka-backend-production.up.railway.app`) — that is the API only.
- Use **Vercel**: `https://codka-bukaanka-frontend.vercel.app/admin/login`
- First production login: email + password only → you are sent to **Admin → Security** to enable Authenticator (TOTP). After that, use the 6-digit code every time.

## Verify

1. `https://YOUR-BACKEND.up.railway.app/health` → `{"status":"ok",...}`
2. Open `https://codka-bukaanka-frontend.vercel.app` — public pages load data
3. `https://codka-bukaanka-frontend.vercel.app/admin/login` — login works

## Local dev

Keep `backend/.env` and `frontend/.env` with `localhost` URLs; production uses hosting dashboards only.
