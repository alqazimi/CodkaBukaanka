# Diiwaanka Bukaanka — Full Project Report

**Generated:** June 2026  
**Project:** Investigative Medical Incident Archive (admin-controlled, not social media)  
**Stack:** Next.js 15 (frontend) + Express + Prisma + PostgreSQL (backend)

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [How the system works](#2-how-the-system-works)
3. [All features (public website)](#3-all-features-public-website)
4. [All features (admin panel)](#4-all-features-admin-panel)
5. [API reference](#5-api-reference)
6. [Database & seed data](#6-database--seed-data)
7. [Environment variables](#7-environment-variables)
8. [How to run (dev & production)](#8-how-to-run-dev--production)
9. [Known errors & fixes applied](#9-known-errors--fixes-applied)
10. [What is missing](#10-what-is-missing)
11. [What to remove or clean up](#11-what-to-remove-or-clean-up)
12. [Security audit](#12-security-audit)
13. [Attack scenarios (DDoS, hacking, abuse)](#13-attack-scenarios-ddos-hacking-abuse)
14. [Production checklist](#14-production-checklist)
15. [Prioritized action list](#15-prioritized-action-list)
16. [File map](#16-file-map)

---

## 1. Executive summary

| Item | Status |
|------|--------|
| **Purpose** | Public archive of verified medical incident records; only admins create/publish content |
| **Public site** | Search, browse hospitals/patients/doctors/medications/cases, contact, corrections, legal pages |
| **Admin panel** | Login, dashboard, CRUD cases + entities, evidence upload |
| **Languages** | English (`/en`) and Somali (`/so`) — partial Somali coverage |
| **Auth** | NextAuth (frontend) + JWT (backend API) |
| **File storage** | Cloudinary (optional) for evidence |
| **Production readiness** | Functional for demo/dev; **not hardened** for high-traffic or hostile internet without fixes in Section 15 |

**Default admin (seed):** `admin@diiwaankabukaanka.org` / `AdminChangeMe123!` — **must change before production.**

---

## 2. How the system works

```
┌─────────────┐     HTTP (3000)      ┌──────────────────┐
│   Browser   │ ◄──────────────────► │  Next.js frontend │
└─────────────┘                      │  NextAuth session │
       │                             └────────┬─────────┘
       │                                      │ API_URL / NEXT_PUBLIC_API_URL
       │                                      ▼
       │                             ┌──────────────────┐
       └────────────────────────────►│  Express API     │
                                     │  Port 4000       │
                                     └────────┬─────────┘
                                              │ Prisma
                                              ▼
                                     ┌──────────────────┐
                                     │  PostgreSQL      │
                                     └──────────────────┘
```

### Case visibility rules

- Public users only see cases with status **`VERIFIED`** or **`PUBLISHED`** (`PUBLIC_CASE_FILTER` in `backend/src/lib/constants.ts`).
- Admins see all statuses in the admin panel.
- Workflow: `DRAFT` → `UNDER_REVIEW` → `VERIFIED` → `PUBLISHED`.

### Search behavior (after recent fixes)

| URL pattern | Behavior |
|-------------|----------|
| `?q=abdi` only | Global grouped search (hospitals, patients, doctors, medications, cases) |
| `?category=MEDICATION_ERROR` only | Filtered case list |
| `?q=abdi&category=MEDICATION_ERROR` | **Combined** — cases matching text **and** category (no unrelated entities) |

### Who can do what

| Action | Public | Admin |
|--------|--------|-------|
| Read published cases | Yes | Yes |
| Search archive | Yes | Yes |
| Submit contact/correction | Yes | No |
| Create/edit cases | No | Yes |
| Upload evidence | No | Yes |
| Manage hospitals/patients/doctors/meds | No | Yes (create/list; limited edit) |

---

## 3. All features (public website)

Base URL: `http://localhost:3000/en` or `/so`

| Route | Feature |
|-------|---------|
| `/[locale]` | Home: hero search, stats, category links, recent cases |
| `/[locale]/search` | Full search + filters (hospital, patient, category, dates) |
| `/[locale]/cases/[slug]` | Case detail: badges, metadata, reason, incident, evidence |
| `/[locale]/hospitals` | Hospital directory |
| `/[locale]/hospitals/[slug]` | Hospital profile + related cases (with filters) |
| `/[locale]/patients` | Patient directory |
| `/[locale]/patients/[slug]` | Patient timeline + cases |
| `/[locale]/doctors` | Doctor directory |
| `/[locale]/doctors/[slug]` | Doctor profile + cases |
| `/[locale]/medications` | Medication directory |
| `/[locale]/medications/[slug]` | Medication profile + related data |
| `/[locale]/categories` | Browse by category (counts) — **not in main nav** |
| `/[locale]/contact` | Contact form → saved to DB |
| `/[locale]/corrections` | Correction request form |
| `/[locale]/privacy` | Privacy policy |
| `/[locale]/terms` | Terms of use |
| `/[locale]/victims` | Redirects to `/patients` (legacy) |
| `/sitemap.xml` | SEO sitemap |
| `/robots.txt` | Disallows `/admin/` |

### UI components (public)

- Sticky header with nav + locale switcher (EN/SO)
- Global search bar with autocomplete suggestions
- Case cards, entity cards, stat cards
- Evidence: image/video gallery + document list
- Database unavailable banner when API is down

---

## 4. All features (admin panel)

Base URL: `http://localhost:3000/admin`

| Route | Feature |
|-------|---------|
| `/admin/login` | Email/password login |
| `/admin` | Dashboard: counts, recent cases, audit log |
| `/admin/cases` | List all cases (any status) |
| `/admin/cases/new` | Create case (auto case number + slug) |
| `/admin/cases/[id]` | Edit case, change status, upload/delete evidence |
| `/admin/hospitals` | Add + list hospitals |
| `/admin/patients` | Add + list patients |
| `/admin/doctors` | Add + list doctors |
| `/admin/medications` | Add + list medications |
| `/admin/victims` | Redirects to `/admin/patients` |

### Admin limitations

- No edit/delete UI for hospitals, patients, doctors, medications (API has PATCH only for some)
- No contact message inbox in admin UI
- No admin user management (password change, new admins)
- No logout API on backend (frontend signOut only)
- “View public site” links hardcoded to `/en`

---

## 5. API reference

**Base:** `http://localhost:4000`  
**Health:** `GET /health`

### Public (`/api`)

| Method | Endpoint | Rate limit | Notes |
|--------|----------|------------|-------|
| GET | `/api/search` | 60/min | `?q=` grouped OR filtered cases |
| GET | `/api/search/suggest` | 60/min | Autocomplete |
| GET | `/api/search/filters` | — | Hospital/patient slugs for UI |
| GET | `/api/stats` | — | Public counts |
| GET | `/api/cases/recent` | — | Recent published cases |
| GET | `/api/cases/slug/:slug` | — | Single case |
| GET | `/api/cases/categories` | — | Counts by category |
| GET | `/api/hospitals` | — | All hospitals |
| GET | `/api/hospitals/:slug` | — | Hospital + cases |
| GET | `/api/patients`, `/api/patients/:slug` | — | Patient data |
| GET | `/api/victims`, `/api/victims/:slug` | — | Alias of patients |
| GET | `/api/doctors`, `/api/doctors/:slug` | — | Doctor data |
| GET | `/api/medications`, `/api/medications/:slug` | — | Medication data |
| GET | `/api/sitemap` | — | Slugs for SEO |
| POST | `/api/contact` | 10/min | Contact form |
| POST | `/api/corrections` | 10/min | Correction form |

### Auth

| Method | Endpoint | Notes |
|--------|----------|-------|
| POST | `/api/auth/login` | Returns JWT — **no rate limit** |

### Admin (`/api/admin` — JWT required)

| Method | Endpoint |
|--------|----------|
| GET | `/api/admin/dashboard` |
| GET/POST/PATCH/DELETE | `/api/admin/cases`, `/api/admin/cases/:id` |
| GET/POST/PATCH | `/api/admin/hospitals`, `/api/admin/hospitals/:id` |
| GET/POST/PATCH | `/api/admin/patients`, `/api/admin/patients/:id` |
| GET/POST/PATCH | `/api/admin/doctors`, `/api/admin/doctors/:id` |
| GET/POST/PATCH | `/api/admin/medications`, `/api/admin/medications/:id` |
| GET/POST/DELETE | `/api/admin/evidence`, `/api/admin/cases/:id/evidence` |
| POST | `/api/admin/upload` | Multer → Cloudinary |

---

## 6. Database & seed data

### Models

`Admin`, `Hospital`, `Patient`, `Doctor`, `Medication`, `Case`, `Evidence`, `AuditLog`, `ContactMessage`

### Seed cases (after `npm run db:seed -w backend`)

| Case # | Title | Patient | Category | Status (public visible?) |
|--------|-------|---------|----------|---------------------------|
| DB-2026-001 | Wrong Insulin Dosage at Akram Hospital | Abdi Mohamed | WRONG_MEDICATION | PUBLISHED — **visible** |
| DB-2026-002 | Misdiagnosis Leading to Delayed Treatment | Ali Xakiim | MISDIAGNOSIS | PUBLISHED — **visible** |
| DB-2026-003 | Delayed Emergency Treatment | Fatima Hassan | DELAYED_TREATMENT | VERIFIED — **visible** |
| DB-2026-004 | Medication Dosage Error | Abdi Mohamed | MEDICATION_ERROR | PUBLISHED — **visible** (after re-seed) |

**Re-seed required** if DB-2026-004 still shows as UNDER_REVIEW:

```bash
npm run db:seed -w backend
```

---

## 7. Environment variables

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection |
| `JWT_SECRET` | Yes | Admin API tokens (32+ random chars) |
| `PORT` | No | Default `4000` |
| `FRONTEND_URL` | Yes | CORS origin |
| `NODE_ENV` | No | `production` enables HSTS |
| `CLOUDINARY_CLOUD_NAME` | For uploads | Evidence files |
| `CLOUDINARY_API_KEY` | For uploads | Evidence files |
| `CLOUDINARY_API_SECRET` | For uploads | Evidence files |
| `ADMIN_EMAIL` | Seed only | Default admin email |
| `ADMIN_PASSWORD` | Seed only | Default admin password |

### Frontend (`frontend/.env`)

| Variable | Required | Purpose |
|----------|----------|---------|
| `API_URL` | Yes | Backend URL (server components) |
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (browser) |
| `AUTH_SECRET` | Yes | NextAuth encryption |
| `AUTH_URL` | Production | e.g. `https://yoursite.com` |

---

## 8. How to run (dev & production)

### Development (recommended: one command from root)

```bash
npm run dev
```

- Frontend: http://localhost:3000/en  
- Backend: http://localhost:4000/health  
- Admin: http://localhost:3000/admin/login  

**Do not** run backend twice (port 4000 conflict). Backend `npm run dev` auto-frees port 4000 on restart.

### Git Bash

If `npm` not found: `bash scripts/setup-git-bash-path.sh` then reopen terminal.

### OneDrive warning

Delete `frontend/.next` if webpack/build errors (`EINVAL` on readlink).

### Production

See `README.md` — backend on Railway/Render, frontend on Vercel, `prisma migrate deploy`, rotate secrets.

---

## 9. Known errors & fixes applied

| Issue | Cause | Fix / workaround |
|-------|-------|------------------|
| `EADDRINUSE :::4000` | Two backends running | Run only one; `backend/scripts/dev.mjs` frees port |
| `spawn EINVAL` (Git Bash) | Spawning `.cmd` files | Dev script uses `node …/tsx/dist/cli.mjs` |
| `permission denied for schema public` | PostgreSQL 15+ | `scripts/fix-db-permissions.sql` |
| Migration conflicts | Old migrations | `scripts/reset-db.sql` + single baseline migration |
| `nav.patients` missing (i18n) | Locale keys | Added to `en.json` / `so.json` |
| Search ignores `category` when `q` set | Frontend/backend logic | Fixed combined search |
| CaseCard crash on hospital page | Missing `hospital` in API | Backend includes relation |
| Corrections form 404 | Missing route | `POST /api/corrections` added |
| Backend `/` returned 404 | No root route | Informative JSON at `/` |
| `.next` corruption on OneDrive | Sync + symlinks | Delete `.next` and rebuild |

---

## 10. What is missing

### High priority

- [ ] **Login rate limiting** — brute-force on `/api/auth/login`
- [ ] **Fix draft leak** — `?status=DRAFT` on search can expose unpublished cases (overwrites public filter)
- [ ] **Change default admin password** in production
- [ ] **Contact message admin inbox** — messages saved but no UI to read them
- [ ] **Re-seed DB** for published MEDICATION_ERROR demo case

### Medium priority

- [ ] Full Somali translations (many pages still English)
- [ ] About page (`nav.about` exists, no route)
- [ ] Admin: edit/delete hospitals, patients, doctors, medications
- [ ] Admin: password change / multiple admins
- [ ] `not-found.tsx` / `error.tsx` pages
- [ ] Case detail + legal pages translated for `so` locale
- [ ] Backend CSP headers (frontend has CSP; backend does not)
- [ ] `trust proxy` for correct IP behind reverse proxy
- [ ] Redis/shared rate limiter for multi-instance deploy

### Low priority

- [ ] Logout audit log entry
- [ ] Cloudinary asset delete when evidence removed
- [ ] Role-based admin permissions (role field exists, unused)
- [ ] Sitemap includes all public routes
- [ ] Featured cases section on homepage (`featuredTitle` in i18n, unused)

---

## 11. What to remove or clean up

### Dead / duplicate code (safe to delete)

| File | Reason |
|------|--------|
| `frontend/src/components/search/SearchBar.tsx` | Replaced by `GlobalSearchBar.tsx` |
| `frontend/src/components/reports/MediaGallery.tsx` | Duplicate of `evidence/MediaGallery.tsx` |
| `frontend/src/components/reports/DocumentList.tsx` | Duplicate of `evidence/DocumentList.tsx` |
| `frontend/src/components/admin/MediaUpload.tsx` | Unused; evidence uses `EvidenceUpload.tsx` |

### Legacy routes (keep redirects, or remove later)

| Route | Action |
|-------|--------|
| `/[locale]/victims` | Redirect to patients — keep for old links or remove after migration |
| `/admin/victims` | Redirect to patients |
| `/api/victims` | API alias — keep for backward compatibility |

### Do not commit to git

- `backend/.env`, `frontend/.env` (secrets)
- `frontend/.next/`, `node_modules/`

---

## 12. Security audit

### What is implemented

| Control | Location | Notes |
|---------|----------|-------|
| bcrypt passwords | `backend` auth | Cost 12 in seed |
| JWT admin API | 8h expiry | Bearer or cookie name `admin_token` |
| NextAuth session | `frontend` | Credentials → backend login |
| CORS | `backend/src/index.ts` | Production: single origin; dev: localhost |
| Security headers (API) | `backend` | nosniff, DENY frame, referrer, HSTS (prod) |
| Security headers (UI) | `frontend/next.config.ts` | CSP, HSTS, frame SAMEORIGIN |
| Rate limiting | Search, contact, corrections | In-memory, per IP |
| Zod validation | Routes | Login, contact, admin CRUD |
| Prisma queries | All DB access | Parameterized (SQL injection resistant) |
| Upload MIME whitelist | 10MB max | JPEG, PNG, WebP, GIF, MP4, WebM, PDF, DOC |
| Public case filter | Most read endpoints | VERIFIED + PUBLISHED only |
| Audit log | Admin mutations + login | IP stored |
| `robots.txt` | Frontend | Blocks `/admin/` |
| JSON body limit | 2MB | Express |

### Vulnerabilities & gaps

| Severity | Issue | Details |
|----------|-------|---------|
| **High** | Draft case leak via search | `searchCases()` allows `?status=DRAFT` to override public filter |
| **High** | No login rate limit | Unlimited password attempts on `/api/auth/login` |
| **Medium** | In-memory rate limit | Resets on restart; not shared across servers — weak DDoS protection |
| **Medium** | IP spoofing | `X-Forwarded-For` trusted without `trust proxy` config |
| **Medium** | JWT in response body | Not httpOnly cookie from API; XSS could steal token |
| **Medium** | Weak enum validation | Admin case status/category as loose strings |
| **Medium** | Arbitrary evidence URLs | Admin can attach any URL without ownership check |
| **Low** | MIME-only upload check | No magic-byte verification |
| **Low** | PII exposure | All patient names listed publicly |
| **Low** | Default seed password | Documented in README |
| **Low** | CSP allows `unsafe-inline` / `unsafe-eval` | Needed for Next.js dev; tighten in production |
| **Low** | No WAF / CDN | No Cloudflare/AWS Shield in project |

### DDoS protection status

| Attack type | Protected? | How |
|-------------|------------|-----|
| Search flood | Partial | 60 req/min per IP (in-memory) |
| Contact spam | Partial | 10 req/min per IP |
| Login brute force | **No** | No limit |
| Large body POST | Partial | 2MB JSON limit |
| Slowloris / L7 flood | **No** | Use reverse proxy + CDN in production |
| DB exhaustion | Partial | Prisma connection pool; no query cost limits on heavy search |

**Recommendation for production:** Put Cloudflare (or similar) in front, enable WAF, use Redis rate limiting, add login throttling, fix draft leak.

---

## 13. Attack scenarios (DDoS, hacking, abuse)

### DDoS (Denial of Service)

**Risk:** Attacker floods `/api/search` or `/api/search/suggest`.

**Current defense:** 60 requests/minute per IP (single server only).

**Gaps:** Multiple IPs bypass limit; restart clears counters; no global cap.

**Mitigation:** Cloudflare rate rules, Redis limiter, captcha on search if abused.

### Brute-force admin login

**Risk:** Attacker tries passwords on `/api/auth/login` and `/admin/login`.

**Current defense:** bcrypt slows hashing only.

**Mitigation:** Rate limit login (5 attempts / 15 min), account lockout, strong password policy, 2FA (not implemented).

### SQL injection

**Risk:** Low — Prisma uses parameterized queries.

**Mitigation:** Keep using Prisma; avoid raw SQL without sanitization.

### XSS (Cross-site scripting)

**Risk:** Stored XSS if admin enters script in case description shown on public site.

**Current defense:** React escapes by default; case text rendered as text/pre-wrap.

**Mitigation:** Sanitize HTML if rich text added later; httpOnly cookies for tokens.

### CSRF

**Risk:** Admin state-changing requests from another site.

**Current defense:** JWT in Authorization header (less CSRF than cookies); CORS restricts origins.

**Mitigation:** SameSite cookies if moving to cookie-only auth.

### Unauthorized data access

**Risk:** Draft cases via `?status=DRAFT` on public search.

**Mitigation:** **Fix immediately** — never allow public `status` filter to override `PUBLIC_CASE_FILTER`.

### File upload abuse

**Risk:** Malware upload, oversized files.

**Current defense:** MIME whitelist, 10MB, admin-only.

**Mitigation:** Virus scan, magic-byte check, separate storage bucket policy.

### Token theft

**Risk:** XSS steals `accessToken` from session or localStorage patterns.

**Mitigation:** httpOnly secure cookies, short JWT expiry, rotate secrets.

---

## 14. Production checklist

- [ ] Change admin password (not `AdminChangeMe123!`)
- [ ] Generate new `JWT_SECRET` and `AUTH_SECRET` (32+ chars)
- [ ] Set `NODE_ENV=production`
- [ ] Set `FRONTEND_URL` to real domain on backend
- [ ] Set `AUTH_URL` on frontend
- [ ] Configure Cloudinary for evidence
- [ ] Run `npx prisma migrate deploy`
- [ ] Run `npm run db:seed` only on empty DB (not over production data blindly)
- [ ] Enable HTTPS (Vercel + backend host)
- [ ] Add Cloudflare or WAF
- [ ] Fix draft search leak (Section 15)
- [ ] Add login rate limiting
- [ ] Set `trust proxy` on Express if behind load balancer
- [ ] Remove `.env` from git history if ever committed
- [ ] Move project off OneDrive for builds (or exclude `.next`)

---

## 15. Prioritized action list

### Do now (security)

1. Fix `searchCases()` so public API **never** accepts `status` filter (or only allows VERIFIED/PUBLISHED).
2. Add rate limiting to `POST /api/auth/login` (e.g. 5/min per IP).
3. Change production admin password and rotate secrets.

### Do soon (product)

4. Run `npm run db:seed -w backend` if medication error case not visible.
5. Build admin inbox for `ContactMessage`.
6. Complete Somali translations for case detail and search.

### Do later (cleanup)

7. Delete unused components (Section 11).
8. Add `not-found.tsx` and error boundaries.
9. Redis rate limiter for multi-instance deploy.

---

## 16. File map

```
codkabukaanka/
├── reports.md                 ← this file
├── README.md                  ← setup guide
├── package.json               ← root: npm run dev (both apps)
├── dev.bat / dev.sh           ← quick start scripts
├── scripts/
│   ├── dev.mjs                ← starts frontend + backend
│   ├── ensure-env.mjs
│   ├── reset-db.sql
│   ├── fix-db-permissions.sql
│   └── setup-git-bash-path.sh
├── backend/
│   ├── src/index.ts           ← Express app
│   ├── src/routes/            ← auth, public, admin
│   ├── src/lib/search.ts      ← search logic
│   ├── src/lib/rate-limit.ts
│   ├── prisma/schema.prisma
│   ├── prisma/seed.ts
│   └── scripts/dev.mjs        ← port cleanup + tsx watch
└── frontend/
    ├── src/app/[locale]/      ← public pages
    ├── src/app/admin/         ← admin panel
    ├── src/components/        ← UI
    ├── src/auth.ts            ← NextAuth
    ├── messages/en.json, so.json
    └── next.config.ts         ← CSP, security headers
```

---

## Quick commands reference

```bash
# Install
npm install

# Dev (both apps)
npm run dev

# Backend only
cd backend && npm run dev

# Frontend only
cd frontend && npm run dev

# Database
npm run db:deploy -w backend
npm run db:seed -w backend
npm run db:studio -w backend

# Build
npm run build

# Clear Next cache (OneDrive issues)
Remove-Item -Recurse -Force frontend\.next   # PowerShell
rm -rf frontend/.next                          # Git Bash

# Health check
curl http://localhost:4000/health
```

---

*End of report. Keep this file updated when you add features or fix security issues.*
