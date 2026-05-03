# INIT — P0 backlog #1: `#51` operational gate closeout (novelty trend)

**Mode:** INIT (VAN) complete → **next: PLAN** only if tooling/env/docs gaps appear; otherwise **BUILD-light** (evidence only) or pure **ops execution**.  
**Date:** 2026-05-03  
**SoT backlog:** `reports/prioritized-backlog-expert-2026-05-03.md` (P0 row #1)  
**GitHub issue:** `#51` `[STAB][P0] novelty-recovery-pass`

---

## INIT completion block (workflow-modes)

```
✅ INIT 완료
━━━━━━━━━━━━━━━━━━
📁 파일: 1 (해당 브리프만 신규; 코드 변경 없음 전제)
📊 복잡도: L1 (운영·측정 중심)
   / 코드: 불필요(게이트 스크립트 존재) / DB 스키마 변경: 없음
➡️ 다음: 운영 실행 → gate51 재측정 → 증거 기록 후 REFLECT
   (스크립트·환경변수·런북 보완이 필요하면 PLAN 1회)
```

---

## 1. Objective (한 줄)

**프롬프트/게이트 코드가 아니라 `content_items`에 쌓인 멀티데이 데이터로 `gate51`을 `PASS` 또는 의도적 `PENDING/FAIL`로 판정**하고, `tasks.md`·이슈 `#51`에 **재현 가능한 증거**를 남긴다.

---

## 2. Technical contract (반드시 알 것)

**구현 소스:** `scripts/content-ops-gate51-trend-check.ts`

| 항목 | 동작 |
|------|------|
| **데이터 소스** | `content_items` 중 `created_at`이 최근 `CONTENT_OPS_GATE51_LOOKBACK_DAYS`(기본 7) 안인 행 |
| **일 버킷** | `created_at`의 UTC **날짜**(`YYYY-MM-DD`)별 집계. 해당 일에 행이 1건이라도 있으면 버킷 1개 |
| **`lowNovelty`** | `metadata.review_gate.latest.reasons` 또는 `metadata.reviewGate.latest.reasons`에 **`low_novelty` 포함** |
| **블로그 비율** | `type === "blog"`만 `blogTotal` / `status === "review_required"`면 `blogReviewRequired` |
| **PENDING: 버킷 부족** | `trend.length < CONTENT_OPS_GATE51_MIN_DAY_BUCKETS`(기본 **2**) → `insufficient multi-day trend buckets` |
| **PASS 조건** | 버킷 ≥ 2이고, **정렬 후 마지막 두 버킷**에 대해 `lowNoveltyRatio`와 `blogReviewRequiredRatio`가 **둘 다 이전 일(직전 버킷)보다 작거나 같음** (`<=`) |

**함의:** “2일치”는 **달력 연속일**이 아니라 **데이터가 존재하는 서로 다른 UTC 날짜가 최소 2개**이면 된다. 다만 비교는 **시간순 마지막 두 버킷**끼리이므로, 중간에 빈 날이 있어도 괜찮다.

**환경 변수 (선택):**

- `CONTENT_OPS_GATE51_MIN_DAY_BUCKETS` — 기본 `2` (프로드 종료 판정 변경 금지 권장)
- `CONTENT_OPS_GATE51_LOOKBACK_DAYS` — 기본 `7`

---

## 3. Preconditions (시작 전 체크)

- [ ] 로컬 또는 CI에서 **`pnpm run content-ops:gate51-trend-check`** 가 `.env.local`의 Supabase **service-capable** 키로 동작함
- [ ] 콘텐츠 파이프라인이 **실제로** `review_gate` 메타데이터를 남기는 경로가 열려 있음 (스테이징만 쓸지 프로덕만 쓸지 **명시**)
- [ ] “건강한 무활동” 기간에는 버킷이 안 늘어날 수 있음 — **의도된 생성/게이트 일정**을 짧게라도 잡을 것

---

## 4. Execution sequence (순차)

1. **베이스라인 캡처**  
   `pnpm run content-ops:gate51-trend-check` → JSON 전체를 파일로 저장 (예: `reports/gate51-snapshots/2026-05-03-pre.json`).

2. **운영 액션 (코드 아님)**  
   - 최소 **서로 다른 UTC 날짜 2일** 이상에 걸쳐 `content_items`가 생기도록 **draft_generate → review_gate** 등 정상 플로우 실행  
   - 가능하면 **블로그 타입**과 **`low_novelty`가 붙을 수 있는** 리뷌 패스가 돌게 함 (프롬프트 v1.4+ 이미 반영됨)

3. **재측정**  
   하루 이상 경과 후 다시 `pnpm run content-ops:gate51-trend-check`  
   - `status: PASS` → **#51 운영 게이트 통과** 후보  
   - `PENDING` + `decisionReason`이 ratio 미개선 → **FAIL 후보**; 개선 계획(프롬프트/입력 다양성 등)은 P2 백로그와 연결

4. **증거 패킹** (둘 다 갱신)  
   - GitHub `#51` 코멘트: 타임스탬프, `generatedAt`, `trend` 배열 요약, `status`, `decisionReason`  
   - `memory-bank/tasks.md`: `#51` 상태, Immediate Next Step 체크, Exit Criteria `P0 #49-#51`  
   - (선택) `memory-bank/progress.md` 한 줄

---

## 5. Evidence template (이슈/노트용)

```text
gate51 operational recheck
- generatedAt: <ISO>
- lookbackDays: <n> minDayBuckets: <n>
- status: PASS|PENDING
- decisionReason: <string>
- trend (last 3 days max):
  - <YYYY-MM-DD>: lowNoveltyRatio=… blogReviewRequiredRatio=… total=…
command: pnpm run content-ops:gate51-trend-check
env: prod|staging (no secrets in ticket)
```

---

## 6. Risk register (INIT)

| 리스크 | 완화 |
|--------|------|
| 24h 동안 `content_items` 생성 없음 | 생성 일정을 명시; P0-3(heartbeat)과 구분 |
| PASS인데 품질은 나쁨 | `pnpm run content-ops:quality:monitor`와 상위 이유 분포를 함께 첨부 |
| 스크립트만 바꿔서 PASS 만들기 | 프로드에서 `MIN_DAY_BUCKETS` 낮추기 금지; 변경 시 설계 리뷰·문서화 |

---

## 7. When to escalate to PLAN

- 버킷 정의가 비즈니스와 안 맞음 (예: UTC vs KST, `created_at` vs `published_at`)  
- `review_gate` 메타 키 불일치로 `low_novelty` 카운트가 항상 0  
→ 그때 **PLAN 1회** 후 BUILD; 본 INIT은 **코드 변경 없음** 전제.

---

## 8. References

- `scripts/content-ops-gate51-trend-check.ts` (실구현)  
- `reports/reaudit-post-cycle-2026-05-03.md`  
- `memory-bank/tasks.md` — `#51`, Immediate Next Step  
- `reports/prioritized-backlog-expert-2026-05-03.md` — P0 #1
