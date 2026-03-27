# Testing — Elevate

## Priority order

1. **Unit** (`tests/unit/`) — pure logic, mocks; runs in CI (`pnpm test`).
2. **Integration** (`tests/integration/`) — real Supabase (service role); **opt-in** via env.
3. **E2E** (`tests/e2e/`) — Playwright against a running app; **manual or optional CI** (browser install).

4. **Middleware → proxy** (Next.js 16 deprecation): tracked upstream; migrate when following the official Next guide — not blocking day-to-day.

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

**Host:** Default base URL is `http://localhost:3000` (not `127.0.0.1`) so auth cookies match `pnpm dev` and `NEXT_PUBLIC_APP_URL`. If you must use `127.0.0.1`, set `PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000` and open the app with the same host.

**Specs:** `smoke.spec.ts` — login page shell only. `auth-dashboard.spec.ts` — password sign-in and dashboard sidebar (Overview + user email in sidebar).

## Adding tests

- Prefer **small modules** under `src/lib/` for unit tests.
- Keep **secrets out of committed tests**; integration is opt-in and uses local env.
- For components, consider Vitest + Testing Library later.
