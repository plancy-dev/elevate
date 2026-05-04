# Active Context — Elevate

**Agent workflow SoT (INIT→ARCHIVE, L1–L4, gstack 보조):** [`AGENTS.md`](../AGENTS.md) § **AI orchestration → Operating model** — 에이전트·인간 모두 **복잡도에 맞는 페이즈**를 생략하지 않음(사용자 fast path만 예외).

## Current Phase — **INIT** (다음 작업 — ARCHIVE 직후)

**직전 웨이브 아카이브:** [`archive/work-history/archive-ai-native-workflow-docs-ops-2026-05-04.md`](archive/work-history/archive-ai-native-workflow-docs-ops-2026-05-04.md) (읽기 전용).

**SoT:** [`tasks.md`](tasks.md) — 특히 **Immediate Next Step** · `[STAB] marketing-cta…` · (선택) [#73](https://github.com/plancy-dev/elevate/issues/73) P2.

### 다음 실행 앵커 (순서)

| # | 트랙 | 할 일 | 검증 / 비고 |
|---|------|--------|----------------|
| 1 | **Ops P0** | 7 UTC일 `scheduled` `content_runs` **또는** `tasks.md`에 automation-off | `pnpm run content-ops:runs-invariant-check` → `reports/*-runs-invariant*.json` |
| 2 | **Ops P0** | Vercel **`CONTENT_OPS_AUTOMATION_RUNTIME=cursor`** + prod `automation-run` 토큰 정합 | 대시보드; 비밀 미기록 |
| 3 | **REFLECT** | PostHog UI — `elevate_marketing_cta_click` · `cta_id` 14값 (ADR-013 §5) | [`reports/reflect-adr013-posthog-2026-05-04.md`](../reports/reflect-adr013-posthog-2026-05-04.md) 참고 |
| 4 | **ENH (병렬 제약 있음)** | [#62](https://github.com/plancy-dev/elevate/issues/62) → [#60](https://github.com/plancy-dev/elevate/issues/60) 시나리오 전 히어로 PR 없음 | `tasks` § 병렬 제약 |

**복잡도:** 증거·운영만 → **L1**. `src`/`tests`/CI 변경 시 **L2** + `pnpm verify` ([`docs/AI_ORCHESTRATION.md`](../docs/AI_ORCHESTRATION.md) §2b).

### 스킬로 INIT 열기 (선택 · 현재 기본은 하이브리드)

- [`docs/MEMORY_BANK_SKILL_GUIDE.md`](../docs/MEMORY_BANK_SKILL_GUIDE.md) — **`elevate-memory-bank-bootstrap`** 지명 시 INIT 산출·L1–L4·다음 모드 한 블록.
- **「스킬 기반만 쓴다」로 팀이 바꾼 뒤**에는 [`tasks.md`](tasks.md) PLAN 에픽의 **Skill-first INIT** 체크박스를 `[x]`로 — 그다음 세션부터는 **짧은 스킬+목표** 지시가 SoT (에이전트가 그때 형태 전환을 맞춤).

**운영 앵커 (지속):** prod `automation-run` GET은 **Vercel 토큰**으로 operator 실행 · 7 UTC일 스트릭은 [`memory-bank/tasks.md`](tasks.md) Immediate Next Step.

## Prior REFLECT — 증거 로그 (2026-05-03)

**Runs invariant:** [`reports/2026-05-03-runs-invariant-recheck.json`](../reports/2026-05-03-runs-invariant-recheck.json) — `PASS`, `maxConsecutiveUtcDaysWithScheduled=2`. **Prod 스모크:** elevate.ai.kr + `.env.local` 토큰 → **401** (Vercel 시크릿과 다를 때 예상). **BUILD:** `947cff1` / `8b17591` — content-ops auth + invariant recheck. **Positioning:** [`docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md`](../docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md); #60 [retract/reframe](https://github.com/plancy-dev/elevate/issues/60#issuecomment-4365916803).

### Stabilization ops — `trigger_type` / `automation_source` (7d calendar)

**Branch:** `main`  
**Focus SoT:** `memory-bank/tasks.md`  
**Prioritized backlog:** `reports/prioritized-backlog-expert-2026-05-03.md`

## Objective

- Close `tasks.md` checklist item for **7 consecutive UTC days** with ≥1 `scheduled` `content_runs` (same DB as prod ops) **or** explicit operator **automation-off** note.
- Re-run `pnpm run content-ops:runs-invariant-check` and refresh `reports/*-runs-invariant-check.json` when extending the observation window.

## Current State

- **gate51:** **PASS** — `reports/gate51-snapshots/2026-05-03-gate51-pass-multiday.json`.
- **P0 #2 / #3:** 최신 스냅샷 [`reports/2026-05-04-runs-invariant-check.json`](../reports/2026-05-04-runs-invariant-check.json) (`generatedAt=2026-05-04T02:16:16.229Z`) — **PASS**, `maxConsecutiveUtcDaysWithScheduled=2`. (직전: [`reports/2026-05-03-runs-invariant-recheck.json`](../reports/2026-05-03-runs-invariant-recheck.json).) **Prod GET:** elevate.ai.kr + 로컬 env 토큰 → **401** (Vercel에 등록한 값과 불일치 시 예상).
- Queue automation `#55`–`#59` complete; stabilization `#49`/`#50`/`#51` gates passed per `tasks.md`.
- **Recheck (2026-05-03):** [`reports/2026-05-03-runs-invariant-recheck.json`](../reports/2026-05-03-runs-invariant-recheck.json) — PASS, streak **2**. **Prod `automation-run` GET (로컬 `.env.local` 토큰):** **401** — 운영 검증은 **Vercel `CONTENT_OPS_AUTOMATION_TOKEN`과 바이트 동일**한 값으로 curl(비밀 미기록).

## Next Immediate Execution Anchors

1. Keep **daily** `scheduled` activity until **7** consecutive UTC days register in `content_runs`, then re-run `pnpm run content-ops:runs-invariant-check` (merge consecutive-day stats into the JSON snapshot pattern used in `reports/2026-05-03-runs-invariant-check.json`).
2. Optional rhythm: `pnpm run content-ops:gate-check` if publish-path gates need corroboration.
3. Code change only if invariant script contract is wrong — otherwise **ops + evidence**.

## Non-Negotiable Safety Constraints

- Do not lower `CONTENT_OPS_GATE51_MIN_DAY_BUCKETS` in production to fake PASS without explicit design sign-off.
- Do not treat metric deltas as valid without capturing full gate51 JSON (`trend`, `decisionReason`).
