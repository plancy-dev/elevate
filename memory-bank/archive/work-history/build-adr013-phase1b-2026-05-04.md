# BUILD — ADR-013 Phase 1b (marketing CTA wiring)

**Date:** 2026-05-04  
**SoT:** `docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md`

## Shipped in repo

- `buildMarketingCtaClickProperties` + `locale` / optional `referrer_path` on every `elevate_marketing_cta_click` capture (`src/lib/analytics/marketing-cta-click-properties.ts`, `src/components/analytics/marketing-tracked-links.tsx`).
- Eight surfaces: home hero pricing + band waitlist; header blog/pricing; pricing monthly/annual checkout (`MarketingTrackedExternalAnchor` on `pricing/page.tsx`); blog post footer waitlist/pricing (`page.tsx`, `header.tsx`, `blog/[slug]/page.tsx`).
- Tests: `tests/unit/marketing-cta-instrumentation.test.ts` (payload + source wiring + 5-locale routing set).
- Ops evidence: `reports/2026-05-03-runs-invariant-build-handoff.json` (runs invariant PASS snapshot; prod curl left to operator).
- RUNBOOK: Vercel cron mismatch noise paragraph (`docs/features/RUNBOOK-content-ops.md`).
- Unit env isolation: `posthog-public.test.ts`, `blog-subscription.test.ts` stub env for deterministic CI/local.

## Post-merge REFLECT

Confirm PostHog 7d non-zero for cta_id set (ADR checklist last box).
