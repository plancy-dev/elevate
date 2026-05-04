# ARCHIVE — AI-native workflow docs + ops evidence wave (2026-05-03–05-04)

**Scope:** 문서 게이트·P2 RFC·Memory Bank INIT 정렬·content-ops runs invariant 재스냅·ADR-013 PostHog REFLECT를 **한 웨이브**로 묶은 기록. 제품 ENH(#60–#62)·P2 구현(#73)은 포함하지 않는다.

## 1. 문서·프로세스 (merged)

| 산출물 | 경로 / 링크 |
|--------|-------------|
| 문서 게이트 (P0–P2 구현 전 검수) | `docs/features/PLAN-ai-native-workflow-doc-gate.md` |
| P2 RFC (문서/구현 PR 경계·수용 기준) | `docs/features/PLAN-ai-native-workflow-p2-rfc.md` |
| PLAN 상위 링크 | `docs/features/PLAN-ai-native-workflow-evolution-2026-05.md` |
| 허브 | `docs/AI_ORCHESTRATION.md` §7, `docs/AI_USAGE.md` |
| ADR 프로세스 | `docs/adr/README.md` |
| GitHub Issues vs PR | `docs/DEV_PROCESS_GITHUB.md` |
| 추적 이슈 | GitHub **#73** (P2 implementation backlog) |
| 문서 PR | **#74** merged to `main` |

**커밋(대표):** `cfbf8fa` (doc-gate PR), `94c5390` (progress REFLECT 한 줄), `f0490b0` (INIT `activeContext`).

## 2. INIT → BUILD (증거만)

| 산출물 | 경로 |
|--------|------|
| Runs invariant 스냅샷 | `reports/2026-05-04-runs-invariant-check.json` (`generatedAt=2026-05-04T02:16:16.229Z`) |
| Memory Bank 동기화 | `memory-bank/tasks.md` Immediate Next Step + BUILD track |

**결과:** `runsInvariant.status=PASS`, `maxConsecutiveUtcDaysWithScheduled=2`, **7 UTC일 스트릭 미달** (이전과 동일 패턴).

**커밋:** `2f084e4`.

## 3. REFLECT (ADR-013 PostHog 게이트)

| 산출물 | 경로 |
|--------|------|
| REFLECT 리포트 | `reports/reflect-adr013-posthog-2026-05-04.md` |
| ADR 체크리스트 메모 | `docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md` (마지막 `[ ]`에 2026-05-04 MCP 결과) |
| STAB 줄 | `memory-bank/tasks.md` — `[STAB][P1] marketing-cta-instrumentation-phase-1` REFLECT 부분 |

**PostHog MCP (project 358775):** HogQL `elevate_marketing_cta_click` 최근 8일 **`count() = 0`** → ADR-013 §5 프로덕션 성공 정의 **미충족** (대시보드·키·트래픽 재확인 필요).

**커밋:** `cd6eb61`.

## 4. 다음 세션으로 넘기는 것 (SoT는 아카이브 밖)

- **`memory-bank/tasks.md`:** 7일 `scheduled` 스트릭 또는 automation-off; Vercel `CONTENT_OPS_AUTOMATION_RUNTIME=cursor`; prod `automation-run` 토큰 정합; STAB marketing-cta PostHog **UI** 검증 후 체크.
- **`memory-bank/activeContext.md`:** 다음 INIT 시 위 항목만 앵커로 재수립.
- **#73:** P2 합의 후 구현 PR.
- **#60–#62:** ENH 별도 트랙.

## 5. 검증 명령 (재현)

```bash
pnpm run content-ops:runs-invariant-check
# PostHog: MCP query-run HogQL (see reflect-adr013-posthog-2026-05-04.md)
```

---

**Status:** ARCHIVEd as historical snapshot; **live SoT** remains `memory-bank/tasks.md` and open checkboxes above.
