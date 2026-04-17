# Studio · Scene render 에픽 — 상태 스냅샷

SoT: [`docs/DEV_PROCESS_GITHUB.md`](../DEV_PROCESS_GITHUB.md) · 추적 파일 [`.github/DESIGN.md`](../../.github/DESIGN.md).

**정책:** 씬 렌더 관련 작업은 **코드·GitHub 이슈**로만 추적한다. 별도 디자인 툴 연동은 사용하지 않는다.

**에픽·Figma 트랙 이슈 (#1, #4–#9):** 2026-04-17 기준 **종료** ([`memory-bank/tasks.md`](../../memory-bank/tasks.md) · GitHub에서 `not planned` / 에픽 `completed`). 제품 구현은 **코드·`type/feature` 이슈**(예: [#12](https://github.com/plancy-dev/elevate/issues/12) 등)로 남긴다.

---

## 순차 백로그 (권장 순서)

1. **코드·이슈** — `area/studio` + `pnpm verify`로 병합된 기능이 SoT.
2. **Runway 추정 상수 ↔ 실요금** — 제품·법무 합의 전까지 **보류** ([`runway-scene-credits-estimate.ts`](../../src/lib/studio-integrations/providers/runway/runway-scene-credits-estimate.ts)).
3. **추가 UX** — 부분 렌더·실패 안내 등은 별도 스코프·이슈로 연다.

**검증:** `pnpm verify`.

---

## 제품 코드 (merged) — 히스토리

| Item | Notes |
|------|--------|
| 렌더 전 예상 크레딧 UI + 면책 | [#12](https://github.com/plancy-dev/elevate/issues/12) 등 · 추정 상수 보류 — 실요금 교체는 제품·법무 후 |
| P1 씬 테이블 · P2 Preflight · P3 포맷 가드 | 구현·이슈는 위 GitHub 히스토리 참고 |

---

*갱신: 2026-04-17 — 에픽 종료·문서 정합.*
