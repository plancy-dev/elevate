# Development environment — Elevate

## Requirements

- **Node.js** ≥ 20 (see `.nvmrc`; use `nvm use` or `fnm use`)
- **pnpm** 9+ (`corepack enable pnpm` or install globally)

## Setup

```bash
pnpm install
cp .env.local.example .env.local
# Fill Supabase URL, anon key, service role (server only), NEXT_PUBLIC_APP_URL
```

Apply SQL migrations in order from `supabase/README.md` (Supabase SQL Editor or CLI).

**Database types:** After changing the remote schema, run **`pnpm db:types`** so `src/types/database.types.ts` matches Supabase (requires access token / project ref — see `scripts/gen-db-types.mjs`).

## Scripts

| Command | Purpose |
|---------|---------|
| `pnpm dev` | Next.js dev server |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Vitest unit tests (`tests/unit/`) |
| `pnpm test:watch` | Vitest watch (unit only) |
| `pnpm test:integration` | Opt-in Supabase smoke — see [TESTING.md](TESTING.md) |
| `pnpm test:e2e` | Playwright — see [TESTING.md](TESTING.md) |
| `pnpm build` | Production build |
| `pnpm verify` | lint + typecheck + unit test + build (local “CI dry run”) |
| `pnpm db:types` | Regenerate `database.types.ts` from Supabase |

## Git hooks

**`pnpm install`** runs `prepare` → **Husky**. On commit, **lint-staged** runs ESLint on staged `*.{ts,tsx,js,jsx,mjs,cjs}` files. Full `pnpm verify` still runs in CI; hooks catch issues early without running the full build every commit.

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, and build on pushes/PRs to `main`. Build uses placeholder `NEXT_PUBLIC_*` values; Vercel injects real env vars at deploy time.

Optional: **`.github/workflows/e2e.yml`** — manual Playwright run or PR label `run-e2e` (repository secrets required). See [TESTING.md](TESTING.md).

## Editor

Recommended VS Code extensions are listed in `.vscode/extensions.json`. Project uses ESLint; format-on-save runs ESLint fixes where configured.

## Cursor MCP

Copy `.cursor/mcp.json.example` → `.cursor/mcp.json` and add tokens locally. `mcp.json` is gitignored.

**PostHog**

- **App (browser SDK):** set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` (or legacy `NEXT_PUBLIC_POSTHOG_KEY`) and `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local` — see `.env.local.example`. Implemented in `PostHogRoot` + `getPosthogPublicConfig()`.
- **MCP (Cursor):** `.cursor/mcp.json.example` includes `posthog` → `https://mcp.posthog.com/mcp` (US). EU: `https://mcp-eu.posthog.com/mcp`. First MCP use → **OAuth**; else `Authorization: Bearer phx_…` ([personal API key, MCP preset](https://app.posthog.com/settings/user-api-keys?preset=mcp_server)) — different from the **`phc_` project token** used in the app. Optional headers: `x-posthog-project-id`, `x-posthog-organization-id`. Wizard: `npx @posthog/wizard mcp add`. Docs: [PostHog MCP for Cursor](https://posthog.com/docs/model-context-protocol/cursor).

## Admin user

See `supabase/README.md` (Dashboard or `pnpm run db:seed-admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` and service role).
