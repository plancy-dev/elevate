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

## Supabase Site URL (auth & redirects)

Production hostname (e.g. **`https://elevate.ai.kr`**) must be consistent across the app and Supabase, or OAuth/email magic links and server-side redirects break.

| Check | Action |
|-------|--------|
| **App origin** | Set **`NEXT_PUBLIC_APP_URL`** to the public URL **without** a trailing slash (same value in Vercel / hosting env). Used by `getSiteUrl()`, invite links, and auth helpers. |
| **Supabase → Authentication → URL configuration** | **Site URL** = that same origin (e.g. `https://elevate.ai.kr`). |
| **Redirect URLs** | Include at least: `https://elevate.ai.kr/**`, `https://elevate.ai.kr/auth/callback`, and local dev (`http://localhost:3000/**`, `http://localhost:3000/auth/callback`) if you test auth locally. Add preview deployment URLs if you use Supabase auth on Vercel previews. |
| **Recovery / email templates** | If Supabase emails link to the Site URL root, ensure PKCE/code handling matches `src/proxy.ts` → `/auth/callback` flow (see `supabase/README.md`). |
| **Payments (Toss)** | Success/fail URLs registered in the Toss dashboard must use the **same host** as `NEXT_PUBLIC_APP_URL`. See [`PHASE2_ENV.md`](./PHASE2_ENV.md). |

After changing Site URL or redirects, smoke-test: sign-in, sign-up, password recovery, and (if enabled) checkout return URLs.

## Dashboard access (`profiles.dashboard_access` + `profiles.role`)

**`/dashboard`** is allowed when **`profiles.dashboard_access`** is **`true`** *or* **`profiles.role`** is **`admin`** (one service-role read of both columns). Use the allowlist for operators without org `admin` role; platform admins from **`pnpm db:seed-admin`** get both flags.

- **Migration:** `supabase/migrations/037_profiles_dashboard_access.sql` adds `dashboard_access` (default `false`).
- **Server:** `SUPABASE_SERVICE_ROLE_KEY` is required so `canUseDashboard` can read `profiles` without RLS blocking the check. If the key is missing or the query fails, access is **denied** (fail closed). On Vercel, confirm this env var is set for **Production** (not only Preview); server logs show `[elevate-auth] canUseDashboard failed` when the check throws.
- **Grant access:** e.g. `update public.profiles set dashboard_access = true where email = 'you@example.com';` or run **`pnpm db:seed-admin`** (sets `role = admin` and `dashboard_access = true` for `ADMIN_EMAIL`).
- **Code:** `src/lib/auth/dashboard-access.ts`, gate in `src/app/(dashboard)/layout.tsx`, page `src/app/(auth)/access-pending/page.tsx`, proxy skip in `src/proxy.ts`.

## Waitlist `source` field

`waitlist_signups.source` stores where the signup came from (default `home`). Allowed values are defined in **`src/lib/waitlist/sources.ts`** (`WAITLIST_SOURCE_VALUES`). The POST **`/api/waitlist`** body may include `source`; unknown values fall back to `home`.

To add a new surface (e.g. blog CTA), add the string to `WAITLIST_SOURCE_VALUES`, use it as `<WaitlistForm source="…" />`, and deploy—no schema change required (`source` is `text`).

## Blog (MDX)

Posts live under **`content/blog/<locale>/<slug>.mdx`** (e.g. `content/blog/en/the-prompt-is-your-product-surface.mdx`). Each supported locale (`en`, `ko`, `ja`, `zh-CN`, `zh-TW`) has its own files—there is **no** automatic fallback to English at runtime. Use YAML front matter: `title`, `description`, `date` (`YYYY-MM-DD`); optional **`ogImage`** (public path, e.g. `/blog/<slug>/hero.jpg`) for post-specific **Open Graph / Twitter** images. Slugs must match `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Loading: `src/lib/blog/posts.ts`. Hero assets live under **`public/blog/<slug>/`** — avoid remote-only hero URLs (they can break). See [`docs/BLOG_POST_PIPELINE.md`](BLOG_POST_PIPELINE.md).

Programmatic weekly generation (Cursor SDK): [`docs/BLOG_AUTOPUBLISH_SDK.md`](BLOG_AUTOPUBLISH_SDK.md).

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

- **App (browser SDK):** set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NEXT_PUBLIC_POSTHOG_HOST` in `.env.local` — see `.env.local.example`. Implemented in `PostHogRoot` + `getPosthogPublicConfig()`.
- **MCP (Cursor):** `.cursor/mcp.json.example` includes `posthog` → `https://mcp.posthog.com/mcp` (US). EU: `https://mcp-eu.posthog.com/mcp`. First MCP use → **OAuth**; else `Authorization: Bearer phx_…` ([personal API key, MCP preset](https://app.posthog.com/settings/user-api-keys?preset=mcp_server)) — different from the **`phc_` project token** used in the app. Optional headers: `x-posthog-project-id`, `x-posthog-organization-id`. Wizard: `npx @posthog/wizard mcp add`. Docs: [PostHog MCP for Cursor](https://posthog.com/docs/model-context-protocol/cursor).

## Admin user

See `supabase/README.md` (Dashboard or `pnpm run db:seed-admin` with `ADMIN_EMAIL` / `ADMIN_PASSWORD` and service role).
