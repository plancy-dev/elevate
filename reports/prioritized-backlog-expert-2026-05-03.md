# Prioritized backlog — filling the gaps (expert view)

**Authoring stance:** staff+ / principal engineer (execution + observability + product risk)  
**Date:** 2026-05-03  
**Inputs:** `memory-bank/tasks.md` (open items), `reports/reaudit-post-cycle-2026-05-03.md`, `reports/automation-three-pillars-gap-analysis-2026-05-03.md`, `reports/init-quality-audit-2026-05-02.md`.

**How to read this list**

- **P0** — blocks correct conclusions, compliance with your own gates, or creates false incidents; do first.
- **P1** — materially improves operator trust, throughput, or statistical validity; schedule in the same sprint as P0 tails.
- **P2** — quality, exploration, and narrative polish; avoids long-term drift.
- **P3** — hygiene, documentation, cadence.

Within a band, items are **roughly ordered** (earlier = higher urgency).

---

## P0 — Correctness, gates, and “we can believe the system”

| # | Work item | Why this tier | Outcome / done when |
|---|-----------|---------------|---------------------|
| 1 | **Close `#51` operationally** — run real generation so **≥2 day buckets** exist; re-run `pnpm run content-ops:gate51-trend-check`; record PASS/FAIL with timestamps in issue + `tasks.md`. | P0 stabilization exit criterion is **not** met until `#51` shows verified metric movement. Code is done; **measurement is the gate.** | `gate51.status !== PENDING` with evidence; or explicit FAIL + remediation plan. |
| 2 | **Production `trigger_type` / `automation_source` invariant** — confirm scheduled runs persist as `scheduled` with expected metadata over **7 consecutive days** (or document explicit “automation off” state). | Local proof exists; **prod audit trail** is still the SoT. Drift here invalidates every ops report. | Query snapshot or automated nightly assert; checkbox cleared in `tasks.md` Immediate Next Step. |
| 3 | **“Healthy idle” vs “stuck pipeline”** — minimal **heartbeat** (expected tick vs last observed run) or equivalent; surface on `/admin/morning-ops` (green/yellow/red). | Re-audit already flags empty fresh windows; without this, **silence is ambiguous** and burns on-call time. | Operator can answer “no work” vs “broken cron” in &lt; 1 minute. |

---

## P1 — Operator trust and decision-quality (newsletter + dashboards)

| # | Work item | Why this tier | Outcome / done when |
|---|-----------|---------------|---------------------|
| 4 | **Time-sliced publish failure UX** — `topPublishFailureReasons` (or parallel panel) for **24h / 7d / 30d** + short copy on **legacy tail** vs current (`sendFailedCount7d` alignment). | Prevents **correct system + wrong story** (already a live risk per re-audit). | Execs stop mis-reading historical `retry_exhausted` as current bleed. |
| 5 | **Deferred reasons panel** — break out `deferredCount` by `frequency_window`, `retry_window_not_open`, batch clamp, etc., with links to `content_runs` / items. | Reduces **false “outage”** when the system is intentionally backing off. | Ops tune the right knob (schedule vs provider vs policy). |
| 6 | **Config-stop runbook-per-code** — one admin page or doc section: reason code → **exact** fix checklist (Resend sandbox, domain mismatch, key). | Incidents are repeated until playbooks are **O(1) lookup**, not grep. | MTTR for config class drops; fewer duplicate tickets. |
| 7 | **Layered SLOs** — internal: attempt success / config-stop rate; product: published ratio / quality. Document in one place. | Single KPI blends **engineering** and **editorial**; optimizes the wrong layer. | On-call and PM use different numbers without fighting. |

---

## P2 — Blog quality, autotune, and throughput (after P0 measurement)

| # | Work item | Why this tier | Outcome / done when |
|---|-----------|---------------|---------------------|
| 8 | **Content diversity controls** — rotate seeds / headline templates / weekly “forbidden phrase” list; **title dedupe** vs recent posts before `review_gate`. | Addresses **clustered signals** (`low_novelty`, comparison/counter) without lowering the bar. | Gate reasons diversify; `low_novelty` share trends with evidence. |
| 9 | **Forced strategy exploration** — ε-greedy or minimum round-robin allocation until each active strategy hits `sampleCount >= K`. | Today’s “winner” can be **path-dependent**; bandit without explore is misleading. | Scoreboard comparison becomes statistically meaningful. |
|10 | **`review_required` SLA** — max age by tier; morning-ops sort by staleness; optional alerts. | Automation quality is **workflow**, not only model score. | Backlog doesn’t silently rot. |

---

## P3 — Cadence, documentation, scorecard

| # | Work item | Why this tier | Outcome / done when |
|---|-----------|---------------|---------------------|
|11 | **Unified “data readiness” strip** in admin — gate51 bucket count + strategy min samples + fresh-window state in **one** banner. | Stops **spurious bugs** on empty charts; cheap UX win. | One glance explains “no data yet” vs bug. |
|12 | **Re-audit cadence** — weekly until `#51` closes; then monthly `reaudit-post-cycle-*`. | Gates without rhythm **decay**. | Calendar event + owner. |
|13 | **Versioned three-pillar scorecard** — recompute 82/58/64 (or successor) when metrics move; date-stamp each revision. | Narrative tracks reality; avoids frozen shame/score. | `reports/init-quality-audit-YYYY-MM-DD.md` pattern continued. |
|14 | **Executor source matrix + quarterly drill** — env → allowed caller → metadata (Cursor vs Vercel fallback). | Most Sev2s are **human** misconfiguration under stress. | Runbook exercised, not shelfware. |

---

## Explicit “not in this backlog” (unless scope changes)

- Rewriting core INIT scope you already shipped (`#38`–`#47`, `#55`–`#59`) — **done**; only harden and observe.
- Disabling review gates to “improve numbers” — **counterproductive**; fix inputs and measurement instead.

---

## Suggested execution order (sprint-shaped)

1. **Week 0–1:** P0 items **1–3** (measurement + prod invariant + heartbeat).  
2. **Parallel thin slice:** P1 **4–5** (dashboard honesty) — can ship with one engineer while ops runs #51.  
3. **Week 2:** P1 **6–7**, then P2 **8–10** as `#51` trajectory becomes visible.  
4. **Ongoing:** P3 as **fill** between incidents.

---

## References

- `reports/automation-three-pillars-gap-analysis-2026-05-03.md` — gap → remediation detail.  
- `reports/reaudit-post-cycle-2026-05-03.md` — current gate and metric snapshot.  
- `memory-bank/tasks.md` — issue SoT and exit criteria.

**Living document:** revise when `#51` closes or production invariant is proven.
