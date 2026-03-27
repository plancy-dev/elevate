# Testing — Elevate

## Priorities (staging / pre-production)

1. **Pure logic** — auth copy (`formatAuthError`, etc.), user display helpers, public env parsing: fast unit tests, no mocks.
2. **Supabase & RLS** — exercise against a real dev project (manual or future integration tests); migrations live under `supabase/migrations/`.
3. **E2E** — add Playwright or similar when flows stabilize (login, dashboard, password reset).

## Commands

```bash
pnpm test          # CI mode: run once
pnpm test:watch    # local TDD
pnpm verify        # same order as CI: lint, typecheck, test, build
```

Tests live in `tests/unit/` and use [Vitest](https://vitest.dev/). Path alias `@/` matches `src/` (see `vitest.config.ts`).

## What is covered now

- `getInitialsFromDisplayName` — edge cases (whitespace-only → `?`).
- `formatUserRoleLabel` — known roles and fallbacks.
- `formatAuthError` / `formatSignInPasswordError` / OAuth callback copy — rate limits and user-facing strings.
- `getPublicSupabaseEnv` / `assertPublicSupabaseEnv` — env presence (uses `vi.stubEnv`).

## Adding tests

- Prefer **small, pure modules** under `src/lib/` so tests stay simple.
- For React components, consider Vitest + `@testing-library/react` later; not required for the current suite.
- Keep **secrets out of tests** — stub env or use the same anonymous JWT placeholder as CI if needed.
