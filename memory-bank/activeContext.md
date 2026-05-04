# Active Context — Elevate

**Agent workflow SoT (INIT→ARCHIVE, L1–L4, gstack 보조):** [`AGENTS.md`](../AGENTS.md) § **AI orchestration → Operating model** — 에이전트·인간 모두 **복잡도에 맞는 페이즈**를 생략하지 않음(사용자 fast path만 예외).

## Current Phase — **INIT** (이슈 목록 정렬 → P0 우선, 새 세션)

**복잡도(오늘 기본):** **L1** — 운영·증거·Memory Bank·PostHog 대시보드 확인이 중심. `src/`·`tests/`·CI를 바꾸면 **L2**로 올려 **`pnpm verify`** 필수([`docs/AI_ORCHESTRATION.md`](../docs/AI_ORCHESTRATION.md) §2b).

**직전 세션 맥락:** ADR-013 Phase 1b BUILD 머지·doc-gate·PR #74·#73 REFLECT 한 줄. 빌드 산출 요약: [`archive/work-history/build-adr013-phase1b-2026-05-04.md`](archive/work-history/build-adr013-phase1b-2026-05-04.md).

### 오늘 P0 (`tasks.md` SoT — 오픈 GitHub 번호와 구분)

| 순서 | 근거 | 작업 | 비고 |
|------|------|------|------|
| P0-a | `tasks.md` **Immediate Next Step** + L183–188 미체크 `[ ]` | SoT DB에서 **연속 7 UTC일** `scheduled` `content_runs` 증거 **또는** `tasks.md`에 **automation-off**(일시·담당·사유) | INIT 이슈 #38–#59는 **완료**; 이건 **런타임 증거** P0 |
| P0-b | `tasks.md` INIT closeout (L19) | Vercel Production에 **`CONTENT_OPS_AUTOMATION_RUNTIME=cursor`** 명시 | **대시보드 작업**, 코드 PR 아님 |
| P0-c | 동일 블록 **prod 스모크** | `automation-run` GET **401 해소** — 토큰은 **Vercel 값과 바이트 동일**하게만 검증(비밀 미기록) | |
| P0-d | REFLECT 잔여 | PostHog 7d **cta_id** non-zero 확인 → ADR-013·`tasks` STAB marketing-cta 줄 갱신 | [#60](https://github.com/plancy-dev/elevate/issues/60) 등 ENH와 **별개** |

**오픈 GitHub 이슈 (참고):** [#73](https://github.com/plancy-dev/elevate/issues/73) P2 구현 백로그(합의 후) · [#60](https://github.com/plancy-dev/elevate/issues/60) [#61](https://github.com/plancy-dev/elevate/issues/61) [#62](https://github.com/plancy-dev/elevate/issues/62) ENH — **오늘 P0 필수 목록에 넣지 않음**(`tasks.md` PLAN·Immediate가 우선).

**다음 모드:** P0-a~c만 **증거/운영**이면 INIT 유지; 코드·테스트 변경 시 **짧은 PLAN → BUILD** → REFLECT.

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
- **P0 #2 / #3:** 최신 스냅샷 [`reports/2026-05-03-runs-invariant-recheck.json`](../reports/2026-05-03-runs-invariant-recheck.json) (`generatedAt=2026-05-03T09:34:49.631Z`) — **PASS**, `maxConsecutiveUtcDaysWithScheduled=2`. **Prod GET:** elevate.ai.kr + 로컬 env 토큰 → **401** (Vercel에 등록한 값과 불일치 시 예상).
- Queue automation `#55`–`#59` complete; stabilization `#49`/`#50`/`#51` gates passed per `tasks.md`.
- **Recheck (2026-05-03):** [`reports/2026-05-03-runs-invariant-recheck.json`](../reports/2026-05-03-runs-invariant-recheck.json) — PASS, streak **2**. **Prod `automation-run` GET (로컬 `.env.local` 토큰):** **401** — 운영 검증은 **Vercel `CONTENT_OPS_AUTOMATION_TOKEN`과 바이트 동일**한 값으로 curl(비밀 미기록).

## Next Immediate Execution Anchors

1. Keep **daily** `scheduled` activity until **7** consecutive UTC days register in `content_runs`, then re-run `pnpm run content-ops:runs-invariant-check` (merge consecutive-day stats into the JSON snapshot pattern used in `reports/2026-05-03-runs-invariant-check.json`).
2. Optional rhythm: `pnpm run content-ops:gate-check` if publish-path gates need corroboration.
3. Code change only if invariant script contract is wrong — otherwise **ops + evidence**.

## Non-Negotiable Safety Constraints

- Do not lower `CONTENT_OPS_GATE51_MIN_DAY_BUCKETS` in production to fake PASS without explicit design sign-off.
- Do not treat metric deltas as valid without capturing full gate51 JSON (`trend`, `decisionReason`).
