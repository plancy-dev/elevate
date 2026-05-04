# Active Context — Elevate

**Agent workflow SoT (INIT→ARCHIVE, L1–L4, gstack 보조):** [`AGENTS.md`](../AGENTS.md) § **AI orchestration → Operating model** — 에이전트·인간 모두 **복잡도에 맞는 페이즈**를 생략하지 않음(사용자 fast path만 예외).

## Current Phase — **PLAN** (남은 클로저 — INIT 이행, 2026-05-05)

**INIT 종료:** 후보 트랙 **Ops | PostHog ADR-013 | #62 | #60 | #61** 를 집합으로 확정했고, 사용자 지시에 따라 **PLAN**으로 전환함. **BUILD 세션마다 트랙은 여전히 하나**만 고른다.

### PLAN — 이번 웨이브 실행 순서 (고정)

| 순서 | 트랙 | 이유 | 다음 모드 |
|------|------|------|-----------|
| 1 | **Ops** (O1→O2) | 제품 분기와 무관, 증거·운영만 | BUILD(스냅샷/스모크) 또는 `tasks.md` automation-off 한 블록 |
| 2 | **PostHog ADR-013** | `tasks.md` STAB `[ ]` 직결 | UI·키·프로젝트 정합 → REFLECT → STAB 줄 갱신 |
| 3 | **#62** | CREATIVE SoT 있음; Productions 노출만 #60과 겹침 | CREATIVE 보강 → BUILD |
| 4 | **#60** | 히어로 **구현 PR** 금지 유지 | 이슈·시나리오 합의·CREATIVE만; 합의 후 BUILD |
| 5 | **#61** | #62와 라우트/컴포넌트 충돌 시 순서 조정 | 스코프 확정 후 BUILD |

### PLAN — 슬라이스 체크리스트 (이번 PLAN 세션에서 채움)

- [ ] **Ops:** `content-ops:runs-invariant-check` 재실행 시점·담당, 또는 automation-off 문구 초안 위치(`tasks.md` 어느 절)
- [ ] **PostHog:** UI 검증 단계(프로젝트·브라우저 키·실클릭) 담당·산출물(`reports/` vs STAB 한 줄만)
- [ ] **#62:** 안 B 착수 vs 마이크로 a11y만 — `creative-dashboard-sidebar.md`에 **한 줄 결정** 남기기
- [ ] **#60 / #61:** 이번 주 **코드 PR 포함 여부** 명시적 아니오 확인(기본: #60 히어로 PR 없음)

### 다음 모드 (PLAN 종료 후)

- **BUILD:** Ops 증거만, 또는 PostHog REFLECT 한 커밋, 또는 #62 구현 PR — **한 세션에 하나**.
- **CREATIVE:** #62 안 B 등 IA — `memory-bank/creative-dashboard-sidebar.md` 먼저.

**직전 BUILD 참고:** #62 — [`TOC.tsx`](../src/components/desk/TOC.tsx), `elevate_dashboard_sidebar_nav_click`, [`dashboard-sidebar-nav-analytics.test.ts`](../tests/unit/dashboard-sidebar-nav-analytics.test.ts).

**직전 아카이브:** [`archive/work-history/archive-ai-native-workflow-docs-ops-2026-05-04.md`](archive/work-history/archive-ai-native-workflow-docs-ops-2026-05-04.md).

**SoT:** [`tasks.md`](tasks.md) · **PLAN 슬라이스(병행):** 아래 표·다이어그램 — Pkg-E62 진입 전 CREATIVE 확장 완료.

### PLAN — 목표·범위

| 구분 | 내용 |
|------|------|
| **목표** | (A) content-ops **7 UTC일** 증거 또는 automation-off 명시 (B) **ADR-013 PostHog** §5 게이트 진행·문서화 (C) ENH **#62 선행** 후 #60/#61과 병렬 가능 범위만 (D) **#73** P2는 합의 후에만 구현 PR |
| **범위 밖** | P2 Hooks/MCP/CI **구현**(#73 합의 전) · #60 **히어로 PR**(시나리오 코멘트 전) · 임계값·게이트 수치 임의 하향 |

### PLAN — 작업 패키지 (순서·의존성)

```mermaid
flowchart LR
  subgraph ops [Ops_L1]
    O1[7d_scheduled_or_off]
    O2[Vercel_runtime_token]
  end
  subgraph reflect [Reflect_L1]
    R1[PostHog_UI_cta_id]
  end
  subgraph enh [ENH_L2]
    E62[sidebar_62]
    E61[pricing_61]
  end
  O1 --> O2
  O2 --> R1
  E62 --> E60gate["hero_60_blocked_until_scenario"]
```

1. **Pkg-O1 (Ops, L1):** 일별 `scheduled` 유지 또는 `tasks.md`에 automation-off 한 블록 → `runs-invariant-check` + `reports/*.json`.
2. **Pkg-O2 (Ops, L1):** Vercel `CONTENT_OPS_AUTOMATION_RUNTIME=cursor` + prod `automation-run` **Vercel 토큰** 스모크(401 해소 확인). RUNBOOK·`.env.local.example`은 이미 문서 정합; **대시보드만** operator.
3. **Pkg-R1 (REFLECT, L1):** PostHog UI에서 `elevate_marketing_cta_click` + `cta_id` breakdown; 프로젝트·키 정합 확인 후 `tasks` STAB 줄·ADR-013 체크리스트 갱신 여부 결정. MCP 0건은 [`reports/reflect-adr013-posthog-2026-05-04.md`](../reports/reflect-adr013-posthog-2026-05-04.md) 참고.
4. **Pkg-E62 (ENH, L2):** [#62](https://github.com/plancy-dev/elevate/issues/62) — `creative-dashboard-sidebar.md`와 5 locale; **BUILD 시 `pnpm verify`**.
5. **Pkg-E61 (ENH, L2, 병렬 가능):** [#61](https://github.com/plancy-dev/elevate/issues/61) — #62와 파일 충돌 시 순서 조정.
6. **Pkg-P2 (프로세스만):** [#73](https://github.com/plancy-dev/elevate/issues/73) 체크 3항 **합의** → 그다음에만 doc-gate §2 밖 구현 PR 분할.

### PLAN — 성공 기준 (이 슬라이스)

- **Ops:** `meetsSevenConsecutiveCalendarDays=true` **또는** `tasks.md` automation-off + invariant PASS 유지.
- **ADR-013:** PostHog에서 14 `cta_id`에 대해 **관측 가능**한지(0이면 원인 문서화 유지) + STAB 상태 문자열 갱신.
- **#62:** Phase 1 REFLECT 완료 + Phase 2 partial(aria-current·sidebar PostHog) — DoD 나머지(13→4~5·전면 a11y)는 CREATIVE→BUILD.
- **#73:** 이슈 체크박스에 합의/보류 기록(코드 불필요).

### 다음 모드

- Pkg-O1~O2·R1만 → **BUILD(증거)** 또는 **REFLECT** 짧게 → **ARCHIVE** 한 줄.  
- Pkg-E62/E61 → **CREATIVE** 완료(위 링크) → **BUILD** → **REFLECT**.  
- 스킬 선호 시: [`MEMORY_BANK_SKILL_GUIDE.md`](../docs/MEMORY_BANK_SKILL_GUIDE.md) · Skill-first 게이트는 [`tasks.md`](tasks.md) PLAN 에픽 체크박스.

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
