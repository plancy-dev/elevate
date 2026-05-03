# ADR-013 — Marketing CTA instrumentation Phase 1 (MarketingCtaId allowlist + surface coverage)

## Status

Proposed (2026-05-03) — locks the MarketingCtaId allowlist, surface set, and event-property contract for **Scenario A** funnel measurement; no new PostHogEvent name strings; no PostHog server/HogQL.

## Context

ADR-012 fixed Scenario A (media-first) as the **marketing / measurement SoT** and pinned the **strategy → existing PostHogEvent constant** mapping (nav_pricing_click → ELEVATE_MARKETING_CTA_CLICK, etc.). It explicitly defers **new cta_id values and surface wiring** to a follow-up ADR.
Today src/lib/analytics/posthog-events.ts ships MarketingCtaId with **6 values** (HERO_EBOOKS, HERO_WAITLIST_ANCHOR, HERO_WAITLIST_INLINE_NOTIFY, HERO_PROMPT_STUDIO, HERO_SIGNUP, BAND_CONTACT). Coverage is **hero-heavy and asymmetric**: pricing nav, blog footer CTA, pricing-card subscribe, and global-header nav are not represented. PostHog cannot decompose Scenario A funnel by surface.
docs/CONTENT_FUNNEL.md lists the **funnel surfaces** (waitlist, billing view, purchase completed) and names src/lib/analytics/posthog-events.ts as the **single source of truth for event name strings**. ADRs map labels; they do not invent or rename events.
memory-bank/creative-elevate-ai-pivot.md keeps **Prompt Studio first** for **product surfaces**; ADR-013 only touches **marketing instrumentation** (Hero / Header nav / Pricing card / Blog post footer / Band) → no conflict.
Related issue: **#60** (Scenario A hero/CTA implementation gates) — ADR-013 narrows scope to instrumentation only and explicitly leaves hero/CTA copy and pricing-page IA to that issue's PRs.
AGENTS.md complexity: Phase 1 = **L2** (PLAN required, no UI redesign). PR 1 (type allowlist + unit test) ≈ trivial review surface; PR 2 (call-site wiring across 8 surfaces) ≈ moderate review surface but no copy/IA change.

## Decision

1. **MarketingCtaId naming rule (locked):** values must be <SURFACE>_<INTENT> in SCREAMING_SNAKE_CASE for the TS key, and <surface>_<intent> snake_case for the wire string. <SURFACE> ∈ {HERO, HEADER, PRICING_CARD, BLOG_POST_FOOTER, BAND}. <INTENT> is a single verb-noun token (e.g. pricing, waitlist, subscribe_monthly).

2. **Phase 1 allowlist — add exactly these MarketingCtaId values (8) to the existing 6:**

   | New MarketingCtaId key | Wire string (cta_id) | Surface |
   |---|---|---|
   | HERO_PRICING | hero_pricing | Marketing home hero |
   | HEADER_NAV_PRICING | header_nav_pricing | Global marketing header |
   | HEADER_NAV_BLOG | header_nav_blog | Global marketing header |
   | BAND_WAITLIST | band_waitlist | Repeating site-wide waitlist band (when present) |
   | BLOG_POST_FOOTER_WAITLIST | blog_post_footer_waitlist | Below-fold CTA in blog post template |
   | BLOG_POST_FOOTER_PRICING | blog_post_footer_pricing | Below-fold CTA in blog post template |
   | PRICING_CARD_MONTHLY | pricing_card_monthly | /pricing plan card (monthly) |
   | PRICING_CARD_ANNUAL | pricing_card_annual | /pricing plan card (annual) |

   Total active set after Phase 1: **14 MarketingCtaId values** (6 existing + 8 new). No existing keys renamed or removed.

3. **Event + properties contract (single event):** every Phase 1 surface fires **PostHogEvent.ELEVATE_MARKETING_CTA_CLICK** (no new PostHogEvent constants). Required properties:

   - cta_id (required, string, must equal one of the wire strings in Decision #2)
   - locale (required, string, one of en | ko | ja | zh-CN | zh-TW)

   Optional properties (allowed but not required):

   - slug (blog post footer CTAs only; string)
   - referrer_path (string, current pathname when known)

   No PII (email, full URL with query, user_id) in properties.

4. **Implementation order — two PRs, sequenced:**

   1. **PR 1 (Phase 1a, ~5 min review):** src/lib/analytics/posthog-events.ts — append the 8 new MarketingCtaId keys exactly as Decision #2 lists. New file tests/unit/marketing-cta-id-stable-values.test.ts asserting (a) all wire strings are unique, (b) all wire strings match ^[a-z][a-z0-9_]*$, (c) the 6 existing values are unchanged. Closes part 1.
   2. **PR 2 (Phase 1b, ~moderate review):** wire ELEVATE_MARKETING_CTA_CLICK calls at the 8 surfaces in Decision #2, passing { cta_id, locale } (and slug for blog footer). 5-locale parity test (tests/unit/marketing-cta-instrumentation.test.ts) asserts each surface fires once with the correct cta_id shape. PR 2 may not start until PR 1 is merged to main.

5. **Success definition (production):** PostHog dashboard segments ELEVATE_MARKETING_CTA_CLICK by cta_id and shows **non-zero hits in 7d for all 14 active cta_id values**, decomposable by locale. This is the **REFLECT exit gate** for ADR-013.

## Non-goals / Out of scope

**No** new PostHogEvent constants. Funnel chips that need LIBRARY_VIEW, BILLING_VIEW, PURCHASE_COMPLETED, etc. use the **existing** constants — Phase 1 does not touch them.
**No** PostHog server / HogQL / project API key / new secret. Server-side aggregation is **Phase 2 ADR (separate)**.
**No** hero/CTA copy or IA changes — that lives in #60 follow-up PRs and must not be merged into Phase 1 PRs.
**No** /pricing currency toggle, no payment provider work — owned by #61.
**No** A/B test framework. If experimentation is needed later, it gets its own ADR (Phase 3+).
**No** auth signup_complete PostHog event introduction. ADR-012 deferred this; if needed, add via separate ADR + posthog-events.ts change.
**No** legacy MICE event additions.

## Consequences

**Positive**

ADR-012's strategy → code mapping becomes **observable end-to-end**: every funnel-relevant marketing CTA emits a stable cta_id.
Cursor / external agents writing future surface code have an **unambiguous allowlist**: add a new MarketingCtaId value only via ADR amendment.
Phase 2 (PostHog HogQL or mirror) inherits a clean property contract — no rework of existing cta_id strings.
Unit tests pin MarketingCtaId as a hard contract; accidental rename or deletion fails CI.

**Negative**

8 new wire strings expand the PostHog event-properties surface area; analytics owners must add them to dashboards once. Mitigation: ADR table is the source for dashboard config.
BAND_WAITLIST and BLOG_POST_FOOTER_* assume those surfaces exist or will exist in PR 2; if a surface is missing, the corresponding wiring task in PR 2 is dropped and the unit test must be relaxed for that single surface (note in PR description, not ADR amendment).
14-value cta_id set is sized for Scenario A. A future Prompt-Studio-first marketing pivot will likely need a separate batch (handled by a future ADR).

## Implementation checklist (BUILD exit)

[x] PR 1 merged: MarketingCtaId extended with 8 keys exactly per Decision #2 (no rename of existing 6).
[x] PR 1 merged: tests/unit/marketing-cta-id-stable-values.test.ts added; CI green via pnpm verify.
[x] PR 2 merged: 8 surfaces emit ELEVATE_MARKETING_CTA_CLICK with { cta_id, locale } per the contract; tests/unit/marketing-cta-instrumentation.test.ts covers each surface.
[x] memory-bank/tasks.md updated with [STAB][P1] marketing-cta-instrumentation-phase-1 entry (Owner / Order / Acceptance / Verify).
[ ] REFLECT note in memory-bank/progress.md after PR 2: confirm 7d PostHog data has non-zero hits for ≥ 12 of 14 cta_id values (allowance for low-traffic surfaces).

## Cursor handoff

text---BEGIN_CURSOR_HANDOFF---복잡도(L1-L4): L2ADR 경로: docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.mdADR Status: Proposed이번 BUILD 범위: PR 1 — src/lib/analytics/posthog-events.ts 에 MarketingCtaId 8 키 추가 + tests/unit/marketing-cta-id-stable-values.test.ts 신규. PR 2 는 PR 1 머지 후 별 BUILD.tasks.md에 추가할 한 줄: - [ ] [STAB][P1] marketing-cta-instrumentation-phase-1 — Owner: rayleighko · Order: after #60 hero PR / parallel-safe with #61, #62 · Acceptance: 14 cta_id 모두 PostHog 7d 데이터에 non-zero · Verify: pnpm verify + tests/unit/marketing-cta-* + PostHog dashboard segment by cta_id.다음으로 읽을 파일: memory-bank/tasks.md, memory-bank/activeContext.md, docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md, docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md검증: 레포 변경 시 pnpm verify금지: ADR에 없는 확장 / 새 시크릿·벤더 API (ADR에 명시된 경우만)---END_CURSOR_HANDOFF---



## Related

[docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md](ADR-012-positioning-2026-q2-scenario-a-media-first.md) — Scenario A SoT and strategy → event mapping table.
[memory-bank/creative-elevate-ai-pivot.md](../../memory-bank/creative-elevate-ai-pivot.md) — North Star; product-surface vs marketing-surface layering.
[docs/CONTENT_FUNNEL.md](../CONTENT_FUNNEL.md) — funnel stages, posthog-events.ts as event-name SoT.
[src/lib/analytics/posthog-events.ts](../../src/lib/analytics/posthog-events.ts) — code SoT; PR 1 target.
[docs/features/RUNBOOK-content-ops.md](../features/RUNBOOK-content-ops.md) — morning-ops surface (Phase 2 PostHog consumer).
[memory-bank/tasks.md](../../memory-bank/tasks.md) — STAB queue placement ([STAB][P1] marketing-cta-instrumentation-phase-1).
#60 — hero/CTA implementation owner; ADR-013 explicitly excludes copy/IA from Phase 1.
#61, #62 — pricing/dashboard owners; parallel-safe with ADR-013 (no shared files).
