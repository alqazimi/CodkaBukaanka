# V2 Upgrade — Medical Incident Intelligence Platform

**Applied:** June 2026  
**Version:** 2.0.0

---

## What changed in V2

### Database (`prisma/schema.prisma`)

| Addition | Purpose |
|----------|---------|
| `RiskLevel` enum | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` — required on every case |
| `Case.riskLevel` | Filtering, sorting, analytics, risk dashboard |
| `EvidenceVisibility` | `PUBLIC` / `PRIVATE` evidence separation |
| `Admin.failedLoginAttempts` | Account lockout after 5 failures |
| `Admin.lockedUntil` | 15-minute lockout window |
| `Admin.totpSecret` / `totpEnabled` | Future 2FA structure |
| `AuditAction.LOGIN_FAILED` | Failed login audit trail |
| Composite indexes | `(status, riskLevel)`, `(status, category)`, `(status, hospitalId)` |

**Migration:** `prisma/migrations/20250603000001_v2_intelligence_security/`

---

### Security hardening

| Feature | File |
|---------|------|
| **Draft leak fix** — public API ignores `?status=DRAFT` | `src/lib/public-filter.ts`, `src/lib/search.ts` |
| **Login rate limit** — 5 attempts / 15 min per IP | `src/lib/login-guard.ts`, `src/routes/auth.ts` |
| **Account lockout** — 5 failed attempts → 15 min lock | `src/lib/login-guard.ts` |
| **Redis-ready rate limiting** | `src/lib/rate-limit-store.ts` — set `REDIS_URL` |
| **Trust proxy** | `src/index.ts` — `TRUST_PROXY=true` or production |
| **Strict CORS** | `src/index.ts` — production single origin |
| **Magic-byte upload validation** | `src/lib/file-validation.ts` |
| **Public/private evidence folders** | Cloudinary `evidence/public` vs `evidence/private` |
| **Zod enum validation** | `src/lib/schemas.ts` — all case fields |

---

### Intelligence layer

| Service | Endpoint | Purpose |
|---------|----------|---------|
| Risk analysis engine | `GET /api/admin/risk-analysis` | Hospital clusters, medication patterns, doctor frequency |
| Admin analytics | `GET /api/admin/analytics` | Cases by hospital/category/riskLevel, trending meds |
| Dashboard | `GET /api/admin/dashboard` | Combined analytics + recent activity |

**Pattern detection:**
- Repeated hospital incidents (risk score)
- Medication issue frequency
- High-frequency doctors in cases
- Critical/high case listing

---

### Search upgrade (`src/lib/search.ts`)

- Relevance ranking (exact → prefix → contains → word match)
- Partial / typo-tolerant word matching
- Multi-entity grouped search (never returns DRAFT/UNDER_REVIEW)
- Combined filters: `q` + `category` + `riskLevel` + hospital + patient + dates
- Sort by `riskLevel` desc, then `incidentDate` desc

---

### Pagination

Public list endpoints now return:

```json
{
  "items": [...],
  "total": 42,
  "page": 1,
  "limit": 12,
  "totalPages": 4
}
```

Endpoints: `/api/hospitals`, `/api/patients`, `/api/doctors`, `/api/medications`

Frontend uses `unwrapList()` for backward compatibility.

---

### Seed data (V2)

| Case | Patient | riskLevel | status |
|------|---------|-----------|--------|
| DB-2026-001 Wrong Insulin Dosage | Abdi Mohamed | **HIGH** | PUBLISHED |
| DB-2026-002 Misdiagnosis | Ali Xakiim | MEDIUM | PUBLISHED |
| DB-2026-003 Delayed Treatment | Fatima Hassan | HIGH | VERIFIED |
| DB-2026-004 Medication Dosage Error | Abdi Mohamed | HIGH | PUBLISHED |

Run: `npm run db:seed -w backend`

---

### Admin UI

- Intelligence dashboard with risk panels
- Case form requires **risk level**
- Case cards show risk badges
- Case detail shows risk level

---

### Environment (new optional vars)

```env
REDIS_URL=redis://localhost:6379   # distributed rate limiting
TRUST_PROXY=true                   # behind nginx/Cloudflare
```

---

### Apply V2 to existing database

```bash
npm run db:deploy -w backend
npm run db:seed -w backend
```

Restart backend after migration.

---

*See `reports.md` for full security audit and production checklist.*
