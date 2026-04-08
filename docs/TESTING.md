# Testing — Elevate

## Priority order

1. **Unit** (`tests/unit/`) — pure logic, mocks; runs in CI (`pnpm test`).
2. **Integration** (`tests/integration/`) — real Supabase (service role); **opt-in** via env.
3. **E2E** (`tests/e2e/`) — Playwright against a running app; **manual or optional CI** (browser install).

4. **Middleware → proxy** (Next.js 16): request pipeline lives in **`src/proxy.ts`** (session refresh, next-intl, auth forwarding). Locale-skipped paths include `/login`, `/dashboard`, `/access-pending`, `/auth`, etc. Migrate when following the official Next guide if the API renames — not blocking day-to-day.

## Commands

| Command | Purpose |
|---------|---------|
| `pnpm test` | Vitest — **unit tests only** (`tests/unit/`) |
| `pnpm test:watch` | Vitest watch, unit only |
| `pnpm test:integration` | Vitest — Supabase smoke (see below) |
| `pnpm test:e2e` | Playwright (install browsers first — see below) |
| `pnpm verify` | lint → typecheck → unit tests → build (same as CI core) |

Path alias `@/` → `src/` is configured in `vitest.config.ts` and `vitest.integration.config.ts`.

## Unit tests (`pnpm test`)

Covers:

- `getInitialsFromDisplayName`, `formatUserRoleLabel`
- Auth UI copy: `formatAuthError`, `formatSignInPasswordError`, OAuth callback messages
- Public env helpers: `getPublicSupabaseEnv`, `assertPublicSupabaseEnv`
- **`loadSidebarUser`** — chainable Supabase mock (profile + org)
- **`POST /api/waitlist`** — mocked Supabase admin insert (honeypot, validation, duplicate)

## Integration tests (`pnpm test:integration`)

Runs only when **all** are set:

- `SUPABASE_INTEGRATION_TEST=1`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Loads `.env.local` from the repo root when present (`dotenv`).

Example:

```bash
# .env.local already has Supabase URL + service role
SUPABASE_INTEGRATION_TEST=1 pnpm test:integration
```

**What it checks:** service-role client can read `profiles` and `organizations` (schema present, API reachable). It does **not** prove RLS policies end-to-end (that needs an authenticated user JWT); use manual QA or future E2E with test credentials.

CI does **not** run integration tests unless you add secrets and env to the workflow.

## E2E (`pnpm test:e2e`)

1. Install browsers once (per machine / CI image):

   ```bash
   pnpm exec playwright install chromium
   ```

2. **Password login → dashboard** (optional but recommended for regression): add to **`.env.local`** (never commit):

   ```bash
   E2E_USER_EMAIL=your-test-user@example.com
   E2E_USER_PASSWORD=your-test-password
   ```

   `playwright.config.ts` loads `.env.local` so these are available to tests. Without them, `auth-dashboard.spec.ts` is **skipped**; the public `smoke.spec.ts` still runs.

3. Start the app, then run tests:

   ```bash
   pnpm dev
   # other terminal:
   pnpm test:e2e
   ```

4. Optional — point at a deployed preview (same `.env.local` or export env in the shell):

   ```bash
   PLAYWRIGHT_BASE_URL=https://your-app.vercel.app pnpm test:e2e
   ```

**Host:** Default base URL is `http://localhost:3000`. If `PLAYWRIGHT_BASE_URL` uses `127.0.0.1`, `playwright.config.ts` rewrites it to `localhost` so cookies match `pnpm dev`. Run the app as `http://localhost:3000` when testing locally.

**Specs:** `smoke.spec.ts` — login page shell only. `marketing-waitlist.spec.ts` — home band waitlist (mocked API) + primary-band Contact sales link. `auth-dashboard.spec.ts` — password sign-in and dashboard sidebar. `library.spec.ts` — login → Library heading. `auth-session.spec.ts` — sign out → login page → sign in again (session regression).

### GitHub Actions (optional)

Workflow **`.github/workflows/e2e.yml`**:

- **Actions → E2E (Playwright) → Run workflow** (manual), or
- Add the label **`run-e2e`** to a pull request to trigger the same workflow.

Add these **repository secrets** (same values as a working `.env.local` against your Supabase project):

| Secret | Purpose |
|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key |
| `E2E_USER_EMAIL` | Test user email |
| `E2E_USER_PASSWORD` | Test user password |

The job runs `pnpm build`, `pnpm start`, then `pnpm test:e2e` against `http://localhost:3000`. It does **not** run on push/PR by default.

## Adding tests

- Prefer **small modules** under `src/lib/` for unit tests.
- Keep **secrets out of committed tests**; integration is opt-in and uses local env.
- For components, consider Vitest + Testing Library later.
