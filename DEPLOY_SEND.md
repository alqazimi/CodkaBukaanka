# CodkaBukaanka — Production setup (send / handoff)

**Always use the custom domain in public.** Do **not** share `*.vercel.app` links — Google Safe Browsing often flags free hosting URLs, especially with login/forms.

**Live URLs (public)**

| Service | URL |
|---------|-----|
| **Public site (Somali)** | https://www.codkabukaanka.com/so |
| **Public site (English)** | https://www.codkabukaanka.com/en |
| **Admin login** | https://www.codkabukaanka.com/admin/login |
| Backend API (Railway) | https://diiwaanka-bukaanka-backend-production.up.railway.app |
| API health | https://diiwaanka-bukaanka-backend-production.up.railway.app/health |

Vercel preview URL (`codka-bukaanka-frontend.vercel.app`) is for **deploy checks only** — not for WhatsApp, bookmarks, or admin login.

---

## 1. Vercel — frontend project

**Settings → General**

| Setting | Value |
|---------|--------|
| Root Directory | `frontend` |
| Framework | Next.js |
| Install Command | `cd .. && npm install` |
| Build Command | `npm run build` |

**Settings → Environment Variables → Production:**

```env
API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app
NEXT_PUBLIC_API_URL=https://diiwaanka-bukaanka-backend-production.up.railway.app

AUTH_URL=https://www.codkabukaanka.com
NEXT_PUBLIC_SITE_URL=https://www.codkabukaanka.com
NEXT_PUBLIC_CANONICAL_HOST=www.codkabukaanka.com

AUTH_SECRET=<paste-your-32+-character-secret-here>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<Cloudflare Turnstile site key>
```

**After saving env vars:** Deployments → Redeploy latest (or push to `main` triggers auto-deploy).

---

## 2. Railway — backend service

```env
NODE_ENV=production
PORT=8080
TRUST_PROXY=true

DATABASE_URL=<from Railway Postgres service>
JWT_SECRET=<64+ random hex — different from AUTH_SECRET>

FRONTEND_URL=https://www.codkabukaanka.com
FRONTEND_URLS=https://www.codkabukaanka.com,https://codkabukaanka.com

CAPTCHA_VERIFY_URL=https://challenges.cloudflare.com/turnstile/v0/siteverify
CAPTCHA_SECRET=<Turnstile secret key>

ENFORCE_ADMIN_TOTP=false

CLOUDINARY_CLOUD_NAME=<your value>
CLOUDINARY_API_KEY=<your value>
CLOUDINARY_API_SECRET=<your value>
USE_LOCAL_UPLOADS=false
```

**Redeploy** backend after changing `FRONTEND_URL` / `FRONTEND_URLS`.

---

## 3. Verify (checklist)

- [ ] https://diiwaanka-bukaanka-backend-production.up.railway.app/health → `{"status":"ok",...}`
- [ ] https://www.codkabukaanka.com/so → homepage loads (no Chrome red screen)
- [ ] https://www.codkabukaanka.com/admin/login → login works
- [ ] Vercel deployment shows **Ready**

---

## 4. Chrome “Dangerous site” on vercel.app

If you see a red warning on `codka-bukaanka-frontend.vercel.app`, that is **common** and **not proof of hacking**. Use `www.codkabukaanka.com` instead.

To clear flags: [Google Search Console](https://search.google.com/search-console) → Security issues → Request review (for each property you use).

See also: `PRODUCTION_ENV.md`
