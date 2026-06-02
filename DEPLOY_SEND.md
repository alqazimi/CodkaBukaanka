# CodkaBukaanka — Production setup (send / handoff)

**Status (code):** Pushed to `main` — commit `1d8e861` (Vercel build fix + Railway URL).

**Live URLs**

| Service | URL |
|---------|-----|
| Frontend (Vercel) | https://codka-bukaanka-frontend.vercel.app |
| Admin login | https://codka-bukaanka-frontend.vercel.app/admin/login |
| Backend API (Railway) | https://diiwaanka-bukaanka-backend-production.up.railway.app |
| API health | https://diiwaanka-bukaanka-backend-production.up.railway.app/health |

---

## 1. Vercel — frontend project

**Settings → General**

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` |
| Framework | Next.js |
| Install Command | `cd .. && npm install` |
| Build Command | `npm run build` |

**Settings → Environment Variables → Production** (copy exactly):

```env
API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app
NEXT_PUBLIC_API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app
AUTH_URL=https://codka-bukaanka-frontend.vercel.app
NEXT_PUBLIC_SITE_URL=https://codka-bukaanka-frontend.vercel.app
AUTH_SECRET=<paste-your-32+-character-secret-here>
```

Include `https://` on every URL (required for `fetch`; host-only values are auto-fixed in code but full URLs are best).

Generate `AUTH_SECRET` (optional new value):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**After saving env vars:** Deployments → Redeploy latest (or push to `main` triggers auto-deploy).

---

## 2. Railway — backend service

**Variables → Production** (minimum for CORS + app):

```env
NODE_ENV=production
PORT=8080
TRUST_PROXY=true

DATABASE_URL=<from Railway Postgres service>
JWT_SECRET=<64+ random hex — different from AUTH_SECRET>

FRONTEND_URL=https://codka-bukaanka-frontend.vercel.app
FRONTEND_URLS=https://codka-bukaanka-frontend.vercel.app

ENFORCE_ADMIN_TOTP=true

CLOUDINARY_CLOUD_NAME=<your value>
CLOUDINARY_API_KEY=<your value>
CLOUDINARY_API_SECRET=<your value>
```

**Redeploy** backend after changing `FRONTEND_URL` / `FRONTEND_URLS`.

---

## 3. Verify (checklist)

- [ ] https://diiwaanka-bukaanka-backend-production.up.railway.app/health → `{"status":"ok",...}`
- [ ] https://codka-bukaanka-frontend.vercel.app/en → stat cards + recent cases visible
- [ ] https://codka-bukaanka-frontend.vercel.app/admin/login → login works
- [ ] Vercel deployment for commit `1d8e861` or newer shows **Ready** (not Error)

---

## 4. Admin login

- **Do not** use the Railway URL in the browser for login — API only.
- Email: `admin@diiwaankabukaanka.org` (or your seeded admin)
- First production login: password only → **Admin → Security** → enable Authenticator (TOTP).

---

## 5. Local development (unchanged)

Keep `frontend/.env` and `backend/.env` on `localhost`. Production values live only in Vercel/Railway dashboards.

See also: `PRODUCTION_ENV.md`
