# Cloudflare WAF — CodkaBukaanka

Domain uses **Cloudflare nameservers**. `www` points to Vercel (CNAME).

## Recommended DNS setup

| Record | Type | Proxy | Target |
|--------|------|-------|--------|
| `www` | CNAME | DNS only (grey) OR Proxied (orange) | Vercel |
| `@` | redirect | — | `www.codkabukaanka.com` (via Vercel) |

**If proxied (orange cloud):** Cloudflare WAF and DDoS apply before Vercel. Set SSL/TLS mode to **Full (strict)**.

**If DNS only:** Rely on Vercel edge + Turnstile. Enable WAF rules still apply to other subdomains.

## Turnstile (already used)

- Admin login + public forms
- Site key on Vercel, secret on Railway

## Recommended WAF rules (Cloudflare dashboard)

1. **Security → WAF → Custom rules**
   - Rate limit `/admin/login` — 10 req/min per IP
   - Block known bad bots (Bot Fight Mode)
2. **Security → Settings**
   - Security Level: **Medium** or **High** during attacks
   - Challenge passage for suspicious IPs
3. **Scrape Shield** — enable hotlink protection if needed

## Vercel Firewall (if on Pro plan)

- Rate limit `/admin/*` and `/api/admin-proxy/*`
- Block countries if site is Somalia-focused only (careful — may block diaspora)

## Railway

- No public ports except HTTPS API
- Do not expose Postgres publicly
- Use `ADMIN_IP_ALLOWLIST` for extra admin API restriction (optional)

## Verification

After enabling rules:

```bash
node scripts/verify-production.mjs
```

Admin login and public forms must still work with Turnstile.
