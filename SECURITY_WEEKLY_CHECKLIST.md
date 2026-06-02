# Security Weekly Checklist (10 Minutes)

Use this every week for `Diiwaanka Bukaanka`.  
Mark each item **PASS** or **FAIL** and note owner/date.

---

## 1) Admin MFA Enforcement

- [ ] PASS / FAIL: All admin accounts have `totpEnabled=true`
- [ ] PASS / FAIL: `ENFORCE_ADMIN_TOTP=true` in deployed env

Quick check:

```bash
# In admin panel: /admin/admins verify 2FA status
# Or query admins table directly if needed.
```

---

## 2) Default Credential Risk

- [ ] PASS / FAIL: No default admin credentials are deployed
- [ ] PASS / FAIL: No shared admin accounts

Quick check:

```bash
# Ensure ADMIN_EMAIL and ADMIN_PASSWORD are custom in production secrets.
# Seed should fail in prod if defaults are used.
```

---

## 3) Login Abuse Protection

- [ ] PASS / FAIL: Login rate-limit active
- [ ] PASS / FAIL: Account lockout/backoff active
- [ ] PASS / FAIL: No unusual lockout spike this week

Quick check:

```bash
# Review backend logs for:
# [security] admin account lockout
```

---

## 4) Session / Token Hygiene

- [ ] PASS / FAIL: `admin_token` cookie is `httpOnly`, `secure`, `sameSite=strict`
- [ ] PASS / FAIL: `JWT_SECRET` and `AUTH_SECRET` are 32+ chars

Quick check:

```bash
# Check env values length and production config.
# Confirm browser cannot read admin auth cookie via JS.
```

---

## 5) Public Data Leak Test

- [ ] PASS / FAIL: Public APIs only return `PUBLISHED` cases
- [ ] PASS / FAIL: Anonymous search never returns draft/private data

Quick check:

```bash
curl "http://localhost:4000/api/search?q=test"
curl "http://localhost:4000/api/cases/recent"
curl "http://localhost:4000/api/cases/slug/<slug>"
```

---

## 6) Authorization Boundaries

- [ ] PASS / FAIL: Every `/api/admin/*` route requires auth
- [ ] PASS / FAIL: Owner-only routes (admin management) are restricted

Quick check:

```bash
# Unauthenticated:
curl -i "http://localhost:4000/api/admin/dashboard"
# Non-owner should get 403 for /api/admin/admins
```

---

## 7) Patch & Dependency Hygiene

- [ ] PASS / FAIL: No critical/high unpatched package CVEs
- [ ] PASS / FAIL: Runtime (Node/OS) patched this month

Quick check:

```bash
npm audit
npm audit -w backend
npm audit -w frontend
```

---

## 8) CORS / Proxy / Edge

- [ ] PASS / FAIL: Production CORS allowlist is strict (`FRONTEND_URLS`)
- [ ] PASS / FAIL: `trust proxy` correctly set behind proxy/CDN
- [ ] PASS / FAIL: Cloudflare/WAF rules active

Quick check:

```bash
# Verify only expected origins succeed in production.
```

---

## 9) Monitoring & Alerts

- [ ] PASS / FAIL: Alerts for failed-login spikes and lockouts
- [ ] PASS / FAIL: Audit logs include login success/failure and admin edits

Quick check:

```bash
# Review audit logs + observability dashboard.
```

---

## 10) Backup & Incident Readiness

- [ ] PASS / FAIL: Backup job succeeded this week
- [ ] PASS / FAIL: Restore test done recently
- [ ] PASS / FAIL: Incident response playbook is current

Quick check:

```bash
# Confirm backup timestamp and test restore evidence.
```

---

## Weekly Record

- Week of:
- Reviewer:
- Overall result: PASS / FAIL
- Highest-priority fix for next week:

