# REFLECT — ADR-013 PostHog §5 (2026-05-05 UTC, MCP HogQL)

**Prior narrative (bundle-only + MCP zero):** [`reflect-adr013-posthog-2026-05-04.md`](./reflect-adr013-posthog-2026-05-04.md) — still valid historical evidence for **chunk-only** `phc_` absence; **superseded for event counts** by this file.

**SoT:** [`docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md`](../docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md) Decision **#5** / **#5a** · **Refs:** ADR-013 (no separate GitHub issue); positioning context **#60** (hero copy/IA out of scope here).

## 1) Machine evidence (PostHog project **358775**)

**Pre-smoke file:** [`posthog-mcp-recheck-2026-05-05.json`](./posthog-mcp-recheck-2026-05-05.json) (`generatedAtUtc`: **2026-05-05T01:44:25Z**) — MCP-only; **8/14** distinct `cta_id` in 7d `GROUP BY` (traffic gap, not wiring).

**Authoritative after operator smoke:** [`posthog-mcp-recheck-2026-05-05-operator-smoke.json`](./posthog-mcp-recheck-2026-05-05-operator-smoke.json) (`generatedAtUtc`: **2026-05-05T01:51:39Z**).

| HogQL (summary) | Result |
|-----------------|--------|
| Allowlist **14** `cta_id` × **7d** `countIf(properties.cta_id = expected …)` | **14/14** with `hits_7d ≥ 1` (`rowsAllNonZero: true`) |
| `elevate_marketing_cta_click` **all time** (`count()`) | **17** (post-smoke) |

**Conclusion (telemetry path):** `elevate_marketing_cta_click` **is ingested** in project 358775; **full breadth verified** via allowlist join (not raw `toString` `GROUP BY` alone — see operator JSON `verdict.notes`). The **2026-05-04** MCP **0** snapshot remains **historical** ([`posthog-mcp-recheck-2026-05-04.json`](./posthog-mcp-recheck-2026-05-04.json)).

## 2) ADR-013 exit gates vs observations

| Gate | Result | Notes |
|------|--------|--------|
| **§5a** — client can init (`phc_` / RSC path) | **PASS** (carry-forward) | HTML/RSC evidence unchanged: [`posthog-prod-html-preflight-latest.json`](./posthog-prod-html-preflight-latest.json) in `tasks.md` / `activeContext.md`. |
| **§5 — CTA smoke** (non-zero custom event) | **PASS** | Total **17** after smoke ([`posthog-mcp-recheck-2026-05-05-operator-smoke.json`](./posthog-mcp-recheck-2026-05-05-operator-smoke.json)). |
| **Decision #5 strict** — **14 / 14** `cta_id` non-zero **7d** | **PASS** | Allowlist HogQL: every expected id `hits_7d ≥ 1`. |
| **Implementation checklist** — “≥ **12** of 14” | **PASS** | Superset of strict gate. |

## 3) Previously “cold” six `cta_id` values — **closed by operator smoke**

Pre-smoke MCP-only breakdown showed **no 7d rows** for: `hero_waitlist_inline_notify`, `hero_signup`, `band_waitlist`, `blog_post_footer_waitlist`, `blog_post_footer_pricing`, `pricing_card_annual`. **One prod click each** (see [`posthog-mcp-recheck-2026-05-05-operator-smoke.json`](./posthog-mcp-recheck-2026-05-05-operator-smoke.json) `smokeActions`) + allowlist re-query → **all six** now **non-zero 7d**.

**Code SoT (unchanged):** `src/app/[locale]/(marketing)/page.tsx`, `blog/[slug]/page.tsx`, `pricing/page.tsx` — wiring was already correct; gap was **observation / traffic**, not instrumentation.

## 4) Next actions

1. **STAB:** [`memory-bank/tasks.md`](../memory-bank/tasks.md) `[STAB][P1] marketing-cta-instrumentation-phase-1` → **`[x]`** with evidence file above.
2. **Do not** expand this REFLECT into **#60** hero copy/IA PRs.
