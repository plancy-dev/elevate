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
| `pnpm build` | Production build |

## CI

GitHub Actions (`.github/workflows/ci.yml`) runs lint, typecheck, and build on pushes/PRs to `main`. Build uses placeholder `NEXT_PUBLIC_*` values; Vercel injects real env vars at deploy time.

## Editor

Recommended VS Code extensions are listed in `.vscode/extensions.json`. Project uses ESLint; format-on-save runs ESLint fixes where configured.

## Cursor MCP

Copy `.cursor/mcp.json.example` → `.cursor/mcp.json` and add tokens locally. `mcp.json` is gitignored.
