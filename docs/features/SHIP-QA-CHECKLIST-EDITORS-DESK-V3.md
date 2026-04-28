# Editor's Desk v3 - Pre-Ship QA Checklist

## Scope

- Design System v3 rollout S0-S7
- Light/Dark theme behavior after S7
- Marketing/Auth/Admin/Billing core surfaces

## 1) Automated Gate

- [x] `pnpm -s tsc --noEmit`
- [x] `pnpm -s eslint src --max-warnings=0`
- [x] `pnpm -s vitest run tests/unit/auth-errors.test.ts tests/unit/editor-column-timeline.test.ts tests/unit/editor-dsl.test.ts`

## 2) E2E Smoke Gate

Run:

- `pnpm -s test:e2e`

Latest run summary (2026-04-28, after v3 selector/prerequisite updates):

- Passed: 7
- Skipped: 2
- Failed: 0

Skipped specs (expected prerequisites):

- `tests/e2e/live-phase123-full-smoke.spec.ts` - skipped when Runway I2V output is unavailable in current env
- `tests/e2e/live-phase2-phase3-smoke.spec.ts` - skipped when connected Buffer channel is unavailable

What was fixed in specs:

- marketing band selector updated to v3-safe locator (removed `section.bg-primary` dependency)
- library heading assertion decoupled from locale-specific copy and profile-title chip
- productions episode pick logic hardened for query/hash variants and empty queues
- live smoke episode target resolution now includes DB fallback
- Playwright config stabilized for shared-account auth flows (`workers: 1`, `fullyParallel: false`)

## 3) Manual Light/Dark Smoke

Environment:

- Local dev server (`http://localhost:3000`)

Checklist:

- [x] `/` renders correctly in light mode
- [x] Theme toggle cycles `System -> Light -> Dark -> System`
- [x] Dark mode contrast is readable on homepage
- [x] `/login` renders correctly in light/dark and toggle works
- [x] `/dashboard` navigation path does not crash (auth redirect behavior is expected)
- [x] No critical runtime/theme errors observed in console during navigation

Manual run result (2026-04-28):

- Status: PASS
- Notes: only non-critical dev warnings (font/image preload, HMR/devtool hints), no dark-theme functional regressions.

## 4) Release Decision Checklist

- [x] Type/Lint/Unit gates green
- [x] Manual light/dark smoke green
- [x] E2E failures triaged and either fixed or explicitly accepted with rationale
- [ ] Final ship approval

## 5) Immediate Follow-ups

1. Keep live smoke prerequisites explicit in CI docs (Runway provider key + Buffer channel connection).
2. Optionally seed deterministic episode/channel fixture for always-on live smoke.
3. If CI runtime allows, revisit worker count with isolated test users instead of shared account.

## 6) Landing V3 Polish QA (2026-04-28)

Scope:

- Landing home KPI panel readability (header-metric-activity rhythm)
- Waitlist band dark-contrast and panel form states
- Cross-page hierarchy consistency (`pricing`, `product`, `solutions`, `blog`)
- Subtle interaction grammar + `prefers-reduced-motion` guard

Automated:

- [x] `pnpm run typecheck` (pass)
- [x] `pnpm run lint` (pass)
- [ ] `pnpm run test` (1 unrelated pre-existing fail: `tests/unit/storage-filename.test.ts` expects `"보고서 2024.pdf"` but got `"보고서2024.pdf"`)
- [x] `pnpm -s test:e2e` (rerun with local dev server): 7 passed / 2 skipped / 0 failed

Manual smoke notes:

- [x] Landing waitlist CTA band locator and submit interaction verified via E2E (`tests/e2e/marketing-waitlist.spec.ts`)
- [x] Home/auth/dashboard entry smoke remains green in current local environment
- [ ] Human visual sign-off (light + dark) pending final reviewer pass in browser

