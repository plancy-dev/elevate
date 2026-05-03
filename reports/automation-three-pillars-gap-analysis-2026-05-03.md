# Automation maturity — three-pillar gap analysis and remediation

**Audience:** engineering + ops owners  
**Date:** 2026-05-03  
**Frame:** Same three scoring areas as `reports/init-quality-audit-2026-05-02.md` — (1) service / ops automation, (2) newsletter automation, (3) blog automation.  
**Current evidence anchor:** `reports/reaudit-post-cycle-2026-05-03.md` (gate-check, quality monitor, gate51).

This document lists **what is still weak or incomplete** after the INIT / stabilization implementation push, and **what to do next** at a staff / principal-engineer level of depth — not ticket-level granularity, but decision-grade guidance.

---

## 1. Executive readout

| Pillar | Primary gap theme | Why it still matters |
|--------|-------------------|----------------------|
| **Service / ops automation** | **Observability vs. idle** — you can prove pipelines *when they run*, but low traffic makes “healthy idle” and “stuck” hard to distinguish without explicit SLOs and synthetic probes. | Without this, regressions surface as “mystery silence” instead of alerts. |
| **Newsletter automation** | **Legacy metrics vs. current posture** — 7d rollups still carry historical `retry_exhausted` / `resend_not_configured` fat tails while **recent** windows are clean. | Operators and executives mis-read dashboards; automation looks broken when it is healing. |
| **Blog automation** | **Quality gate throughput vs. novelty proof** — review pressure (`low_novelty`, comparison/counter signals) is visible; **#51** closure needs **multi-day statistical buckets**, not another code drop. | Prompt and gate logic is in place; **measurement cadence and sample** are the bottleneck. |

---

## 2. Pillar 1 — Service development / operations automation

### 2.1 Documented gaps

1. **`trigger_type` / source-of-truth drift**  
   - Historical rows showed `manual`-only patterns; scheduled path was validated locally but **production** persistence of `scheduled` + `automation_source` is not yet a routine invariant.  
   - Risk: cron/executor policy changes do not show up in `content_runs`, so audits lie.

2. **“Healthy idle” is not first-class**  
   - When `freshGeneratedCount=0` and gate51 has no 24h sample, the system does not say whether **no work was scheduled** or **work was scheduled and failed before telemetry**.  
   - Risk: false reassurance or false panic.

3. **Regression detection vs. low-volume domains**  
   - Three-day regression logic exists, but with sparse daily buckets, statistical power is weak; `hasInsufficientStrategySample` style flags are necessary but not surfaced as a unified “data readiness” banner for ops.

4. **Runbook / executor duality (Cursor vs Vercel)**  
   - Policy is intentional (Cursor-first), but **human procedures** for incident fallback must stay in lockstep with env — mismatch is a **process** failure mode, not only code.

### 2.2 Remediation directions

| Gap | Remediation | Rationale (15y lens) |
|-----|-------------|----------------------|
| Trigger persistence | **Contract test or nightly assert:** last N hours must contain expected distribution of `trigger_type` for enabled schedules OR an explicit “automation paused” flag in config. | You cannot operate what you cannot query consistently. |
| Healthy idle | **Heartbeat row or metric:** e.g. `content_ops_automation.last_expected_tick_at` vs `last_observed_run_at`; green/yellow/red in morning-ops. | Separates “quiet by design” from “quiet because cron auth failed.” |
| Low-volume stats | **Minimum sample banner** in admin quality views — same semantics as gate51 `minDayBuckets`. | Prevents leadership from forcing gate closure without power. |
| Executor duality | **Single printed “source matrix”** in runbook: env var → allowed caller → expected metadata fields. Drills twice a quarter. | Human alignment is how most on-call Sev2s actually get resolved. |

---

## 3. Pillar 2 — Newsletter automation

### 3.1 Documented gaps

1. **Dashboard semantics: cumulative failure archaeology**  
   - `topPublishFailureReasons` can remain dominated by **old** `retry_exhausted` / `resend_not_configured` counts while `sendFailedCount7d=0`.  
   - Risk: correct system, incorrect narrative.

2. **Deferred vs failed operator story**  
   - `deferredCount` can be high (frequency windows, batch clamps) — distinct from **failure**. If UI bundles them, ops over-rotate on the wrong lever.

3. **Config-stop class explosion**  
   - Normalization into config-stop reasons is right; **fewer, sharper** operator messages reduce time-to-fix when Resend or domain policy shifts again.

4. **End-to-end SLO not single-number**  
   - “Published ratio > 60%” from audit is a **product** target; engineering SLO should split: *attempt success*, *provider accept*, *recipient-side* (if ever measured).

### 3.2 Remediation directions

| Gap | Remediation | Rationale |
|-----|-------------|-----------|
| Archaeology in UI | **Time-bounded failure breakdowns:** strict 24h / 7d / 30d with copy explaining “legacy tail.” Optionally exclude pre-cutover rows by `processed_at` watermark. | Separates “healed” from “still bleeding.” |
| Deferred clarity | **Dedicated deferred reasons panel** (frequency_window, retry_window_not_open, batch clamp) with links to run IDs. | Reduces confusion with send failure. |
| Config-stop UX | **Runbook snippet per reason code** (sandbox sender, domain mismatch, missing API key) — one screen, no grep. | Same incident, seconds vs minutes. |
| SLO layering | **Internal SLO:** e.g. “99% of publish *attempts* complete without unhandled exception; 95% without config-stop.” Public KPI stays separate. | Prevents chasing the wrong percentile. |

---

## 4. Pillar 3 — Blog automation

### 4.1 Documented gaps

1. **#51 closure is statistically blocked, not technically blocked**  
   - `gate51-trend-check` needs **≥2 day buckets**; re-audit shows only one bucket (`2026-05-01`) in the trend array.  
   - Interpretation: **cannot** claim novelty recovery until the calendar and volume cooperate.

2. **Quality pressure stack**  
   - `low_novelty`, `comparison_missing`, `counterargument_missing`, `possible_overcopy_detected` cluster — suggests **single root**: models are still **defaulting to safe sameness** under pressure.  
   - Gates are doing their job; **prompt + retrieval + diversity controls** need iteration, not disabling gates.

3. **Strategy scoreboard sample asymmetry**  
   - One strategy dominates samples (`overcopy_mitigate`); others at zero — autotune is **partially blind**.  
   - Risk: “winner” is an artifact of history, not of deliberate experimentation.

4. **Blog throughput vs review_required ratio**  
   - Audit target “review_required < 35%” is not proven in re-audit snapshot; backlog SLA not explicit in product terms.

### 4.2 Remediation directions

| Gap | Remediation | Rationale |
|-----|-------------|-----------|
| #51 / buckets | **Run gate51 on a schedule** after known generation days; optionally **lower `minDayBuckets` only in dev/stage** with fixture data — never in prod closure. | Statistical honesty beats optimism. |
| Sameness cluster | **Content mix policy:** rotate seeds, headline templates, and “forbidden phrase” lists per week; add **dedupe** against recent titles in metadata before review_gate. | Breaks rerun-of-last-week pattern without lowering bar. |
| Autotune blindness | **Forced exploration:** ε-greedy or round-robin minimum allocation per strategy until `sampleCount >= K` for each active strategy. | Bandits without exploration are political polls. |
| Throughput SLA | **Define operator SLA:** max age in `review_required` by tier; morning-ops sorts by staleness. | Makes “automation quality” a workflow metric, not only LLM scores. |

---

## 5. Cross-cutting recommendations

1. **Single “data readiness” surface** — fuse gate51 bucket count, strategy min samples, and fresh-window zeros into one admin strip so nobody files false bugs on empty charts.  
2. **Re-audit cadence** — repeat `reaudit-post-cycle-*` weekly until P0 (#51) closes, then monthly.  
3. **Version the audit scorecard** — maintain rolling scores (82 / 58 / 64 from 2026-05-02) with **dated** recomputation when metrics move, so narrative tracks reality.

---

## 6. References

- `reports/init-quality-audit-2026-05-02.md` — original three-pillar scorecard and gaps.  
- `reports/reaudit-post-cycle-2026-05-03.md` — post-cycle metrics and gate states.  
- `memory-bank/tasks.md` — issue SoT (`#51` pending, runtime alignment open).  

---

## 7. Status

**Living document.** Update when: (a) `#51` operational gate passes, (b) trigger_type invariant is proven in prod over a week, (c) dashboard time-slice semantics ship.
