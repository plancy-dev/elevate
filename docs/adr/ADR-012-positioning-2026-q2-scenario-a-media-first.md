# ADR-012 — Q2 2026 positioning: Scenario A (media-first GTM)

## Status

Accepted (2026-05-03) — **narrative / measurement SoT** for go-to-market copy, ops scoreboards Phase 1, and PostHog interpretation. Implementation PRs reference this ADR.

## Context

- GitHub **#60** records a **deliberate scenario choice**: **A = media-first** (public-facing story centers recurring media — blog, newsletter, practical “weekly” promise) before Prompt Studio–first homepage renovation.
- **`memory-bank/creative-elevate-ai-pivot.md`** and **`docs/CONTENT_FUNNEL.md`** historically describe **Prompt Studio first** + **ebooks as Trojan horse** for product/architecture. That remains valid for **product surfaces** (dashboard IA, Prompt Studio MVP, catalog). It **conflicts** with **marketing headline / hero / pricing story** under Scenario A unless explicitly layered (see § Resolution).
- **`src/lib/analytics/posthog-events.ts`** is the **only** source of truth for **event name strings** sent to PostHog. ADRs must not invent duplicate event IDs; they map **strategy labels → existing constants**.

## Decision

1. **GTM narrative (2026-Q2):** **Scenario A — media-first.** Primary visitor story: trusted **media + subscription** lane; Prompt Studio and catalog stay **real products** but are **secondary in hero/primary CTA** until #60 follow-up PRs land per issue DoD.
2. **North Star doc:** Long-term flywheel (agents, B2B lock-in) unchanged. **Short-term story hierarchy** for **marketing** is overridden by this ADR until superseded by a later ADR.
3. **Phase 1 — `/admin/morning-ops` “business strip”:** **Supabase-only** aggregates — no new secrets, no PostHog server API in Phase 1:
   - **Waitlist:** `waitlist_signups` (volume / recent window as specified in implementation).
   - **Ebook / catalog access:** existing entitlement / org content tables (e.g. `organization_content_entitlements`, `content_products` linkage) as implemented in code.
   - **Prompt Studio beta:** `prompt_studio_beta_allowlist` + `STUDIO_BETA_REQUIRE_ALLOWLIST` behavior — surface “beta coverage” or count suitable for operators.
4. **Phase 2 (backlog):** PostHog **HogQL** or **export mirror** for funnel chips; requires **explicit** env (e.g. project API key), rate limits, and security review — **out of scope** for Phase 1 strip PR.

## PostHog — strategy label → code SoT (no new event names in Phase 1)

| Strategy / ADR label (documentation only) | `PostHogEvent` constant | Properties / notes |
|-------------------------------------------|--------------------------|--------------------|
| `nav_pricing_click` | `ELEVATE_MARKETING_CTA_CLICK` | `cta_id`: add a **new** `MarketingCtaId` value when instrumenting (e.g. `nav_pricing`); **do not** rename existing events. |
| `subscribe_start` | `ELEVATE_FUNNEL_BILLING_VIEW` | Existing funnel event; use for “entered pay/subscribe path”. |
| `subscribe_complete` | `ELEVATE_FUNNEL_PURCHASE_COMPLETED` | Completed purchase / subscription per product definition. |
| `signup_complete` (lead) | `ELEVATE_WAITLIST_SUBMITTED` | Waitlist submit = primary **lead** conversion in current stack. **Auth `signup` completion** is not separately named here; add only via new ADR + `posthog-events.ts` if needed. |

Instrumenting new `cta_id` values is a **separate** BUILD PR; this ADR only fixes **naming contract**.

## Consequences

- **#60** implementation PRs must align hero/blog/pricing with Scenario A; creative docs must **cross-reference this ADR** to avoid “Prompt Studio first” being read as **homepage** SoT.
- **CREATIVE / BUILD** for Subscription Scoreboard strip: Phase 1 queries **Supabase** only; Phase 2 PostHog documented in `memory-bank/tasks.md` backlog.
- **Reviews** that cite “ADR positioning” must mean **`docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md`** (in-tree), not `outputs/` paths.

## Related

- #60 — positioning / hero / CTA (decision gate).
- [`memory-bank/creative-elevate-ai-pivot.md`](../../memory-bank/creative-elevate-ai-pivot.md) — long-term North Star; **marketing hierarchy** clarified there.
- [`docs/CONTENT_FUNNEL.md`](../CONTENT_FUNNEL.md) — funnel stages; **headline vs product** layering clarified there.
- [`reports/automation-three-pillars-gap-analysis-2026-05-03.md`](../../reports/automation-three-pillars-gap-analysis-2026-05-03.md) — ops vs business visibility.
- [`docs/features/RUNBOOK-content-ops.md`](../features/RUNBOOK-content-ops.md) — morning-ops operator flow.
