# Active Context — Elevate

**Agent workflow SoT (INIT→ARCHIVE, L1–L4, gstack 보조):** [`AGENTS.md`](../AGENTS.md) § **AI orchestration → Operating model** — 에이전트·인간 모두 **복잡도에 맞는 페이즈**를 생략하지 않음(사용자 fast path만 예외). 아래 블록은 **운영 서브트랙**(7일 `scheduled` 불변)에 대한 앵커.

## INIT session — 다음 착수 (ops streak + 증거 마감)

**전제 (이미 한 일):** Vercel Production에 `CONTENT_OPS_AUTOMATION_TOKEN` 등록. 토큰 검증 로직은 [`src/lib/content-ops/automation-auth.ts`](../src/lib/content-ops/automation-auth.ts)로 공통화됨 (`automation-run` · `daily-snapshot`).

| 항목 | 내용 |
|------|------|
| **목표** | (1) **재배포 후** prod `automation-run` **스모크** (401 아님) (2) SoT DB에서 **연속 7 UTC일** `trigger_type=scheduled` ≥1건/일 (3) `pnpm run content-ops:runs-invariant-check` 스냅샷 + `tasks.md` 런타임 체크리스트 정리 **또는** automation-off 명시 |
| **복잡도** | **L1** — 운영·증거·선택적 커밋(리팩터 PR 미푸시면 `pnpm verify` 후 푸시). 인바리언트 스크립트/라우트 결함만 **L2 → PLAN → BUILD** |
| **터치 경로** | Vercel **Redeploy** · 운영 base URL · [`src/lib/content-ops/automation-auth.ts`](../src/lib/content-ops/automation-auth.ts) · [`scripts/content-ops-runs-invariant-check.ts`](../scripts/content-ops-runs-invariant-check.ts) · `memory-bank/tasks.md` · `reports/*-runs-invariant-check.json` · [`docs/features/RUNBOOK-content-ops.md`](../docs/features/RUNBOOK-content-ops.md) · [`.env.local.example`](../.env.local.example) (문서) |
| **SoT** | [`memory-bank/tasks.md`](tasks.md) Immediate Next Step · RUNBOOK |

**프리플라이트 (이번 INIT → 실행 순서):**

1. **배포 반영:** env 변경만 했다면 Vercel **재배포** 후 진행.
2. **Prod GET 스모크:** `GET …/api/content-ops/automation-run?scenario=daily_generation&source=cursor&token=<Vercel에 넣은 값>` — **401 금지** (런타임 mismatch면 `skipped` + `next_action` — RUNBOOK대로 `CONTENT_OPS_AUTOMATION_RUNTIME`·`source` 정합).
3. **일별 scheduled:** 크론/Cursor 정책 유지해 **UTC 일**마다 `scheduled` 행 누적 (`2026-05-02` 시작 스트릭이면 **7일째까지** 관측).
4. **증거:** SoT DB cred로 `pnpm run content-ops:runs-invariant-check` → `maxConsecutiveUtcDaysWithScheduled ≥ 7`이면 `reports/*-runs-invariant-check.json` 저장, `tasks.md` 해당 `[ ]` 해소.
5. **부가 큐 (스트릭 후·병렬 가능):** content-ops auth 리팩터 **커밋/PR** 미반영이면 main 반영 · GitHub **#62** 나머지(사이드바)는 CREATIVE 갱신 후 착수 · **#60** 코멘트 전 히어로/포지셔닝 PR 없음.

**INIT 체크리스트:** `memory-bank/` · `tasks.md` 확인 완료 · 복잡도 **L1** · **다음: 운영 실행(BUILD 생략) → REFLECT(증거·tasks)** / 예외 시에만 PLAN→BUILD.

## Current Phase

### REFLECT — 증거 로그 (2026-05-03)

**Runs invariant:** [`reports/2026-05-03-runs-invariant-recheck.json`](../reports/2026-05-03-runs-invariant-recheck.json) — `PASS`, `maxConsecutiveUtcDaysWithScheduled=2`. **Prod 스모크:** elevate.ai.kr + `.env.local` 토큰 → **401** (Vercel 시크릿과 다를 때 예상). **BUILD:** `automation-auth` 공통화·invariant 스크립트 `consecutiveScheduledDaysUtc`·`dotenv quiet` — 아래 커밋으로 main 반영.

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
