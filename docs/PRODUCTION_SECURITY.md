# Production security — Elevate (Vercel)

This document aligns with the [Vercel production checklist](https://vercel.com/docs/production-checklist) **Security** and **Reliability** themes: what the repo implements, what the platform provides, and what remains manual or follow-up work.

---

## Platform (Vercel)

| Topic | Notes |
|--------|--------|
| **TLS** | Terminated at the edge; production custom domains get HTTPS automatically. |
| **HSTS** | Typically applied by Vercel for production domains — do not duplicate a second long `Strict-Transport-Security` in Next.js unless you coordinate with Vercel’s headers. |
| **DDoS / WAF** | Use [Vercel Firewall](https://vercel.com/docs/security/vercel-firewall) and deployment protection for sensitive previews as needed — not configured in this repo. |

---

## Response headers (`next.config.ts`)

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Reduces MIME sniffing attacks. |
| `X-Frame-Options: SAMEORIGIN` | Reduces clickjacking; our app is not intended to be embedded cross-origin. |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limits referrer leakage on cross-origin navigations. |
| `Permissions-Policy` | Disables sensitive features we do not use (`camera`, `microphone`, `geolocation`). **Hosted checkout** (Lemon/Polar) runs on the PSP origin; this header is not tuned to block payment flows. |

### Content-Security-Policy (CSP)

**Not set in code.** A strict `Content-Security-Policy` without nonces breaks Next.js inline bootstrapping and third-party scripts (e.g. PostHog). A proper rollout would use:

- Nonces or hashes from middleware / Next.js [CSP guide](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy), and  
- Allowlists for `connect-src` (Supabase, PostHog ingest, payment domains).

Track as a dedicated task when product prioritizes CSP over “baseline headers only.”

---

## `POST /api/waitlist`

| Control | Implementation |
|----------|------------------|
| **Honeypot** | `website` field — bots that fill it get `200` without insert (existing). |
| **Payload size** | JSON body limited (default **4096** bytes, max **1 MiB** via `WAITLIST_MAX_BODY_BYTES`). Returns **413** if exceeded. |
| **Rate limit** | Per **client IP** (from `x-forwarded-for` / `x-real-ip` / `x-vercel-forwarded-for`), **in-memory fixed window**. Defaults: **30** requests per **60** seconds (`WAITLIST_RATE_LIMIT_MAX`, `WAITLIST_RATE_LIMIT_WINDOW_SEC`). Returns **429** with `Retry-After`. |

### Rate limiting — limitations (important)

- **Serverless:** Each instance has its own memory map — limits are **per warm instance**, not globally across all regions/instances.
- **Spoofing:** Client IPs come from proxy headers — fine for abuse **throttling**, not for cryptographic identity.
- **Global limits:** For strict anti-abuse, add **Vercel Firewall rules**, **Upstash Redis / Vercel KV** rate limiting, or a dedicated edge rate-limit product.

Environment variables (see `.env.local.example`):

- `WAITLIST_RATE_LIMIT_MAX`
- `WAITLIST_RATE_LIMIT_WINDOW_SEC`
- `WAITLIST_MAX_BODY_BYTES`

---

## Secrets & configuration

- **Never** commit real keys; use Vercel Project Settings and `.env.local` for development.
- **Service role** (`SUPABASE_SERVICE_ROLE_KEY`) is server-only — documented in `.env.local.example`.
- **OAuth / Site URL:** `NEXT_PUBLIC_APP_URL` must match Supabase and Vercel — see [`docs/DEVELOPMENT.md`](DEVELOPMENT.md).

---

## Dependency audit

Run periodically:

```bash
pnpm audit
```

`package.json` includes **`pnpm.overrides`** where needed — e.g. `minimatch@3>brace-expansion` pinned to **1.1.12** so ESLint’s `minimatch@3` does not incorrectly resolve to `brace-expansion@5` (API mismatch). Revisit after major dependency bumps.

---

## Related

- [`docs/CONTENT_FUNNEL.md`](CONTENT_FUNNEL.md) — analytics events (no PII in event props for marketing flows).
- [`docs/MARKETING_OPS_CHECKLIST.md`](MARKETING_OPS_CHECKLIST.md) — SEO / Lighthouse operations.
