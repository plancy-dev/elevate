# 콘텐츠 큐 — 에이전트 검토 (자동 집계)

**일시:** 스냅샷 `generatedAt`은 [`content-queue-aggregate-2026-05-05.json`](./content-queue-aggregate-2026-05-05.json) 참고.  
**데이터:** SoT DB `content_items` 최대 500행 (`updated_at` 내림차순), 서비스 롤 — `/admin/content-queue`와 동일 소스.

## 스크린샷 정합

대시보드 카드 **승인 대기 59 · 24h 초과 17 · 즉시 검토 57** 은 JSON `summaryCards`와 **일치**한다.

## 집계 요약

| 지표 | 값 |
|------|-----|
| 스캔 행 수 | 80 |
| `review_required` | 57 |
| 그중 뉴스레터 / 블로그 | 49 / 8 |
| 게이트 사유 `citation_coverage_low` | **45** (압도적 다수) |
| `possible_overcopy_detected` | 6 |
| `comparison_missing` / `counterargument_missing` | 각 6 |
| `low_novelty` | 11 |
| AI `latest.decision` 분포 (메타 있는 행만) | `needs_rewrite` 5 · `hold_manual` 12 · `auto_approve_candidate` 6 |

`byAiDecision` 합이 57보다 작은 이유: 다수 행에 `metadata.ai_review.latest`가 없음(트리지 미실행 또는 구버전 행).

## 판단 (자동 검토)

1. **체계적 병목:** 게이트 실패의 중심은 **인용 커버리지(`citation_coverage_low`)** 이다. 스크린샷의 주황 `citation_coverage_low` 뱃지와 동일 패턴.
2. **SLA:** `slaRiskReviewRequired=17` — `review_required`이면서 생성 후 24h 이상 경과. 운영 우선순위 상 **이 집단부터** 큐 리라이트 또는 수동 편집이 맞다.
3. **AI 심사:** `needs_rewrite` + 정책 메시지(자동 승인 비후보)는 **현재 게이트 미통과 상태에서 억지 승인하면 안 됨** — 코드 상 `review_gate_not_passed` 등으로 막히는 설계와 일치.
4. **권장 파이프라인 액션 (코드 변경 없이):**
   - `docs/features/RUNBOOK-content-ops.md`의 **Cursor `queue_review_window` / `queue_triage`** 시나리오로 `citation_coverage_low` 다수 배치 처리.
   - 본문 보강 후 `review_gate` 재평가까지 돌리고, 그다음에만 `승인/스케줄`.
5. **한계:** 본 리포트는 **본문 품질 판독(저널리즘)** 을 대체하지 않는다. 메타데이터·분포·SLA만 자동 검토한다.

## 산출물

- [`content-queue-aggregate-2026-05-05.json`](./content-queue-aggregate-2026-05-05.json)
- 스크립트: `scripts/content-queue-aggregate-report.ts` — JSON만 필요하면 `pnpm exec tsx scripts/content-queue-aggregate-report.ts`; npm 스크립트는 `pnpm run content-ops:queue-aggregate`.
