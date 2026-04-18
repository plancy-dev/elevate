# Progress — Elevate

**SoT for roadmap priority:** [`tasks.md`](tasks.md) · **current focus:** [`activeContext.md`](activeContext.md)

---

## Product surface (2026)

- **Marketing** (`[locale]/(marketing)/`): shared **`elevate-marketing-chrome`** shell, Pretext hero, catalog/pricing/contact/blog, etc. Tokens and rollout: [`docs/design/VISUAL_LANGUAGE_V2.md`](../docs/design/VISUAL_LANGUAGE_V2.md), [`docs/design/SYSTEM.md`](../docs/design/SYSTEM.md).
- **App** (`(dashboard)/`): IBM-style blue primary, sidebar, Library · Prompt Studio · Studio Productions · Billing · Team · Settings. List/overview patterns: [`docs/design/DASHBOARD_UX_PRINCIPLES.md`](../docs/design/DASHBOARD_UX_PRINCIPLES.md).
- **Access control**: `/dashboard` requires **`profiles.dashboard_access`** (service role in `canUseDashboard`); otherwise `/access-pending`. REFLECT: [`archive/work-history/reflect-dashboard-access-pkce-2026-04.md`](archive/work-history/reflect-dashboard-access-pkce-2026-04.md).
- **Legacy MICE** (events/venues/attendees): schema retained; several `/dashboard/events|venues|…` paths redirect to `/dashboard` per `next.config.ts`. No new features here.

---

## Engineering

- **Stack**: Next.js 16 (App Router, RSC), TypeScript, Tailwind v4, Supabase, Vercel. Request boundary: `src/proxy.ts` (session + next-intl; see [`docs/TESTING.md`](../docs/TESTING.md) § middleware note).
- **CI**: `.github/workflows/ci.yml` — lint, typecheck, unit tests, build (`pnpm verify` equivalent).
- **Quality gate**: `pnpm verify` before ship; Husky + lint-staged on commit (no `commit --no-verify`).

---

## Completed vs open (high level)

| Area | Status |
|------|--------|
| Content catalog, entitlements, Toss PoC, Library | Shipped (see `tasks.md` Phase B) |
| Library detail, Lemon billing entry, purchase history, admin catalog edits (`020`–`021`) | Shipped 2026-04 — [`archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md`](archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md) |
| Prompt Studio placeholder + beta allowlist | Shipped |
| Studio Productions v1 (episodes, artifacts, workbench) | Shipped — ADR [`docs/adr/ADR-003-studio-productions-mvp.md`](../docs/adr/ADR-003-studio-productions-mvp.md) |
| Visual language v2 + marketing/dashboard surface alignment | Shipped (see `tasks.md` P1 backlog) |
| PostHog funnels saved in UI | Ops — [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) |
| E2E on PR label | Optional — `e2e.yml` |

---

마지막 구조 갱신: `tasks.md` Phase 정의와 맞출 것.
