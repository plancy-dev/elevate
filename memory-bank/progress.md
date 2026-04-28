# Progress — Elevate

**SoT for roadmap priority:** [`tasks.md`](tasks.md) · **current focus:** [`activeContext.md`](activeContext.md)

---

## Product surface (2026)

- **Marketing** (`[locale]/(marketing)/`): shared **`elevate-marketing-chrome`** shell, Pretext hero, catalog/pricing/contact/blog. Active design contract: [`docs/adr/ADR-011-design-system-v3-editors-desk.md`](../docs/adr/ADR-011-design-system-v3-editors-desk.md).
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
| Blog subscription Phase 1 (Lemon monthly/annual + premium paywall) | **INIT prepared 2026-04-28** — [`docs/features/INIT-blog-subscription-lemon-phase1.md`](../docs/features/INIT-blog-subscription-lemon-phase1.md), next: PLAN |
| Content catalog, entitlements, Toss PoC, Library | Shipped (see `tasks.md` Phase B) |
| Library detail, Lemon billing entry, purchase history, admin catalog edits (`020`–`021`) | Shipped 2026-04 — [`archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md`](archive/work-history/archive-dashboard-billing-library-lemon-2026-04.md) |
| Prompt Studio placeholder + beta allowlist | Shipped |
| Studio Productions v1 (episodes, artifacts, workbench) | Shipped — ADR [`docs/adr/ADR-003-studio-productions-mvp.md`](../docs/adr/ADR-003-studio-productions-mvp.md) |
| **Scene keyframes + Runway I2V + Buffer scheduled publishing (Phase 1 + Phase 3)** | **Shipped 2026-04-24 — [`ADR-009`](../docs/adr/ADR-009-studio-image-providers-and-keyframes.md) · migrations `038`–`041`** |
| Editor's Desk v3 S0 (tokens/fonts/archive/guards) | Shipped 2026-04-27 — `src/styles/tokens.css`, `src/app/globals.css`, `src/app/layout.tsx`, `eslint.config.mjs`, `memory-bank/archive/design-v2/` |
| Editor's Desk v3 S1 (primitives + migration) | Shipped 2026-04-27 — `src/components/desk/*` 추가, `src/components/ui/*` 프리미티브 리라이트, `src/lib/design-system-classes.ts` 제거 |
| Editor's Desk v3 S2 (shell replacement) | Shipped 2026-04-27 — `DeskShell` + `TOC` + `Masthead` + `CommandBar` + `use-shortcut` 도입, dashboard/admin 사이드바 계열 제거 |
| Editor's Desk v3 S3 (Columnar Timeline signature) | Shipped 2026-04-27 — `src/components/desk/ColumnTimeline/{Column,Playhead,Rule}.tsx` + fullscreen editor `Timeline` 컬럼형 단/플레이헤드 매핑 + `tests/unit/editor-column-timeline.test.ts` |
| Editor's Desk v3 S4 (Scene/Publish + episode/editor shell sweep) | Shipped 2026-04-27 — scene/publish surface, episode wrappers, fullscreen editor chrome를 v3 ink/paper/vermilion + 1px rule 언어로 정렬 (동작/스키마 무변경) |
| Editor's Desk v3 S5 (Marketing + Auth + shared marketing shell) | Shipped 2026-04-28 — marketing/auth 전 표면 + shared header/footer/nav/theme/logo를 v3 ink/paper/vermilion 규칙으로 정렬, legacy `text-text-*`/`bg-layer-*`/`border-marketing-border-subtle` 계열 제거 |
| Editor's Desk v3 S6 (Admin + Billing + Legacy lock) | Shipped 2026-04-28 — admin/billing 표면 정렬 + `src/**` legacy v2 클래스 wipe + `src/app/globals.css` legacy shim 제거, `rg` 기반 잔여 0건 |
| Editor's Desk v3 S7 (Dark theme) | Shipped 2026-04-28 — 다크 토글과 v3 토큰 경로 동기화(`.dark`/`[data-theme=\"dark\"]`/`:root.dark`), `color-scheme` 적용으로 시스템 테마/수동 전환 일관화 |
| Visual language v2 + marketing/dashboard surface alignment | Superseded by Editor's Desk v3 rollout (S1-S7 in progress) |
| PostHog funnels saved in UI | Ops — [`docs/POSTHOG_FUNNELS.md`](../docs/POSTHOG_FUNNELS.md) |
| E2E on PR label | Optional — `e2e.yml` |
| **Timeline editor (Phase 2 — U5 + U6)** | **Shipped 2026-04-24 — [`ADR-010`](../docs/adr/ADR-010-fullscreen-timeline-editor.md) · editor DSL v3 + FFmpeg overlay/xfade/amix builders · 마이그레이션 0건 (JSONB 재활용)** |
| **Scene → Publish REFLECT/ARCHIVE (Phase 1+2+3)** | **Documented 2026-04-24 — [`archive-scene-to-publish-2026-04.md`](archive/work-history/archive-scene-to-publish-2026-04.md) + REFLECT Phase 1/3 + Phase 2 문서 · Reliability Hardening 포함** |

---

마지막 구조 갱신: 2026-04-28 (Blog subscription INIT 반영)
