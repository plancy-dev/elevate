# REFLECT — ADR-013 PostHog §5 (2026-05-04 UTC, 번들 + MCP)

**SoT:** [`docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md`](../docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md) Decision **#5** (7d non-zero by `cta_id`) · **#5a** (build-time `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`).

## 1) Production client bundle (`elevate.ai.kr`)

- **Method:** Fetch homepage HTML → extract `/_next/static/chunks/*.js` → download **20** chunks with deployment query `dpl_3bADDiD1TDuPKUCK7NLBEjQzgfkE`.
- **Result:** **no** file contained literal substring `phc_` → `verdict_bundleContainsProjectKeyLiteral: false`.
- **Machine:** [`posthog-prod-bundle-check-latest.json`](./posthog-prod-bundle-check-latest.json) (also [`posthog-prod-bundle-check-2026-05-04.json`](./posthog-prod-bundle-check-2026-05-04.json) pointer row).

**Conclusion:** Current Production **JavaScript bundle was built without** an inlined PostHog project token → `PostHogRoot` resolves to children-only (no `posthog-js` init with key) → **marketing CTA captures from prod cannot reach** project 358775 until **env is set before a new build** + **Redeploy**.

### 1b) Recheck — newer deployment (still no `phc_`)

- **When:** `2026-05-04T04:33:10Z` (agent run, UTC).
- **Deployment id:** `dpl_CaSEFDG92aEGMsPWjWLmR4jLrBNH` — **differs from §1**, so the homepage is serving a **new** build.
- **Result:** **20** chunk sample, **`phc_` still absent** → build still lacks inlined project token (env not available at **build** time, wrong name, or empty value).
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T043310Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T043310Z.json).

### 1c) Recheck — another new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:34:14Z` (agent run, UTC).
- **Deployment id:** `dpl_3FawzRHvV14GiwdFi27GUj9g4Wow`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T043414Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T043414Z.json).

### 1d) Recheck — new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:35:52Z` (agent run, UTC).
- **Deployment id:** `dpl_p81Vn5EvCdvUZr4ZHvHuP61vkcQw`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T043552Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T043552Z.json).

### 1e) Recheck — new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:36:34Z` (agent run, UTC).
- **Deployment id:** `dpl_BYNK8WDgpHGY54bGZfufLnAUVpT8`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T043634Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T043634Z.json).

### 1f) Recheck — new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:39:15Z` (agent run, UTC).
- **Deployment id:** `dpl_8ZoKzWHZcqabVJJa8sp7VbAF5YgE`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T043915Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T043915Z.json).

### 1g) Recheck — new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:41:20Z` (agent run, UTC).
- **Deployment id:** `dpl_CzqCLSPuQwe6oBK1YfCz4bE4uqFZ`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T044120Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T044120Z.json).

### 1h) Recheck — new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:42:30Z` (agent run, UTC).
- **Deployment id:** `dpl_6eJQaYWAUNvEY3VKvUi7YNyVuWby`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T044230Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T044230Z.json).

### 1i) Recheck — new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:43:46Z` (agent run, UTC).
- **Deployment id:** `dpl_83tumz87fu5ws45FNcfrCahf8xEA`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T044346Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T044346Z.json).

### 1j) Recheck — new `dpl` (still no `phc_`)

- **When:** `2026-05-04T04:44:34Z` (agent run, UTC).
- **Deployment id:** `dpl_CHnn5SZg8HNRz9RcAxTLEnnLoH3q`.
- **Result:** **20** chunk sample, **`phc_` absent**.
- **Machine:** [`posthog-prod-bundle-preflight-quick-2026-05-04T044434Z.json`](./posthog-prod-bundle-preflight-quick-2026-05-04T044434Z.json).

**Ops (parallel, not §5):** prod `GET /api/content-ops/automation-run?scenario=daily_generation&source=cursor` — **HTTP 200**, `ok: true` — latest smoke @ `2026-05-04T04:41:20Z` ([`2026-05-04-ops-o2-automation-run-smoke.json`](./2026-05-04-ops-o2-automation-run-smoke.json)); previously `04:39:12Z`. **Caution:** each successful smoke **runs** `daily_generation`; use sparingly and check `/admin/runs` when debugging.

**Ops O1 (parallel, not §5):** [`runs-invariant-recheck-latest.json`](./runs-invariant-recheck-latest.json) — **PASS** @ `2026-05-04T04:44:43Z`; `maxConsecutiveUtcDaysWithScheduled` **3** (UTC days `2026-05-02`–`04`); machine copy [`2026-05-04-runs-invariant-recheck-044434Z.json`](./2026-05-04-runs-invariant-recheck-044434Z.json).

## 2) PostHog MCP (project **358775**)

| Query | Result |
|--------|--------|
| `elevate_marketing_cta_click` last **7d** | **0** (recheck **~04:44 UTC** same) |
| All events last **7d** | **0** |
| All events last **30d** | **33** (`$autocapture` 15, `$pageview` 13, …) |
| `elevate_marketing_cta_click` **all time** | **0** |
| `max(timestamp)` | **2026-04-08T05:24:09.645Z** |

**Machine:** [`posthog-mcp-recheck-2026-05-04.json`](./posthog-mcp-recheck-2026-05-04.json).

**Conclusion:** No ADR-013 marketing CTA events are stored in this project (ever, per MCP). Recent 7d silence aligns with **no live SDK init from prod** (bundle evidence) and/or no traffic to a correctly instrumented build.

## 3) ADR-013 REFLECT exit gate

**Status:** **NOT satisfied.**

## 4) Next actions (operator → then agent REFLECT)

1. Vercel **Production:** set **`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`** = PostHog **Project API key** (`phc_…`) for project 358775. **Exact env name** (case-sensitive): `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` — not `NEXT_PUBLIC_POSTHOG_KEY`; server `POSTHOG_KEY` alone does **not** inline into the browser bundle ([`src/lib/env/posthog-public.ts`](../src/lib/env/posthog-public.ts)).
2. **Redeploy** Production (**after** the variable is saved). If bundle still lacks `phc_`, use **Redeploy with cleared build cache**.
3. Re-run **§5a preflight** (grep/scan chunks for `phc_`) until `true`.
4. **CTA smoke** on prod (multiple surfaces / locales).
5. MCP or UI: confirm `elevate_marketing_cta_click` > 0 and breakdown by `cta_id`; then STAB `[ ]`, `tasks.md` Active session checklist, and ADR Implementation checklist.

**Wrong env name:** Do not rely on `NEXT_PUBLIC_POSTHOG_KEY` alone — code SoT is **`NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN`** ([`src/lib/env/posthog-public-constants.ts`](../src/lib/env/posthog-public-constants.ts)).
