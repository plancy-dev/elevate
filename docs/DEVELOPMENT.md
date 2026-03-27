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

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests, and build on pushes/PRs to `main`. Build uses placeholder `NEXT_PUBLIC_*` values; Vercel injects real env vars at deploy time.

Optional: **`.github/workflows/e2e.yml`** — manual Playwright run (repository secrets required). See [TESTING.md](TESTING.md).

## Editor

Recommended VS Code extensions are listed in `.vscode/extensions.json`. Project uses ESLint; format-on-save runs ESLint fixes where configured.

## Cursor MCP

Copy `.cursor/mcp.json.example` → `.cursor/mcp.json` and add tokens locally. `mcp.json` is gitignored.

## Admin user

See `supabase/README.md` (Dashboard or `pnpm run db:seed-admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` and service role).
