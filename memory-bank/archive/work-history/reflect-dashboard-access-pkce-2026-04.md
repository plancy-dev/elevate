# REFLECT — Dashboard gate & auth callback (2026-04)

## What shipped

1. **`/dashboard` access** — Always gated by **`profiles.dashboard_access`** (service-role read in `canUseDashboard`). No `DASHBOARD_ACCESS_STRICT` / waitlist / org-role shortcuts. Distinct from **`profiles.role`** (org-scoped admin/viewer).
2. **Migration `037`** — `profiles.dashboard_access boolean default false`. Operators grant via SQL or `pnpm db:seed-admin` (now sets `dashboard_access: true`).
3. **PKCE callback** — On `exchangeCodeForSession` failure, **do not** redirect to `next` using a **stale** `getSession()` when the error is **code verifier missing** (`pkce-session-recovery.ts` + `auth-callback-client.tsx`). Sign out and send to `/auth/auth-code-error` instead.
4. **Docs** — `docs/DEVELOPMENT.md`, `docs/TESTING.md`, `supabase/README.md`, `.env.local.example`, operator checklist aligned with the above.

## Lessons

- **Org `role === admin`** from `ensureDefaultOrganization` must not imply product-shell access; every solo signup became org admin, so env-only “strict” gates were easy to misconfigure.
- **PKCE “recovery”** that trusts any existing session after exchange failure is unsafe and confused users who hit verifier-missing (wrong device / storage cleared).
- **Fail closed** when `SUPABASE_SERVICE_ROLE_KEY` is missing avoids accidentally open dashboard in broken deploys.

## Refactor / follow-up (not done here)

- **OAuth redirect domain** — Social login returns to the **deployed Site URL** (e.g. `elevate.ai.kr`); local vs prod Supabase redirect URL list must stay in sync (`docs/SOCIAL_AUTH.md`). No code change in this pass.
- **Memory bank / tasks** — Updated in same commit to remove stale `DASHBOARD_*` gate descriptions.
- Optional: cookie-based PKCE storage across subdomains if cross-origin starts become common (Supabase SSR guidance).

## Follow-up (middleware + PKCE)

`updateSession` must **not** call `getUser` / `getSession` on **`/auth/callback`**: the server client’s cookie `setAll` can refresh session cookies and **drop the PKCE code-verifier chunks** before the client runs `exchangeCodeForSession` (production symptom: verifier not found on same origin).

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test` (unit), `pnpm build` before commit.
