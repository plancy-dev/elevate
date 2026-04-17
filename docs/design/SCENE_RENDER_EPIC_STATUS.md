# Studio · Scene render 에픽 — 상태 스냅샷

SoT: [`docs/DEV_PROCESS_GITHUB.md`](../DEV_PROCESS_GITHUB.md) · 에픽 [#1](https://github.com/plancy-dev/elevate/issues/1) · 추적 파일 [`.github/DESIGN.md`](../../.github/DESIGN.md).

**정책:** 씬 렌더 관련 작업은 **코드·GitHub 이슈**로만 추적한다. 별도 디자인 툴 연동은 사용하지 않는다.

---

## 순차 백로그 (권장 순서)

1. **에픽·브랜치** — [#1](https://github.com/plancy-dev/elevate/issues/1) 마일스톤(P0→P3) 확인.
2. **[#6](https://github.com/plancy-dev/elevate/issues/6)** P1 씬 테이블 — 제품 구현·수락 기준 충족 시 닫기.
3. **Runway 추정 상수 ↔ 실요금** — 제품·법무 합의 전까지 **보류** ([`runway-scene-credits-estimate.ts`](../../src/lib/studio-integrations/providers/runway/runway-scene-credits-estimate.ts)).
4. **[#7](https://github.com/plancy-dev/elevate/issues/7)** P2 Preflight — 모달 구현됨; 부분 렌더/실패 UX 등은 별도 스코프.
5. **[#8](https://github.com/plancy-dev/elevate/issues/8)** P3 — 포맷 힌트·예산 문구·`scene-budget-constants` (제품 반영됨); 남은 UX는 이슈 본문 기준.
6. **에픽 마무리** — [#1](https://github.com/plancy-dev/elevate/issues/1) 체크리스트·CHANGELOG·릴리즈 후 클로즈 검토.

**검증:** `pnpm verify`.

---

## 제품 코드 (merged)

| Item | Issue | Notes |
|------|--------|--------|
| 렌더 전 예상 크레딧 UI + 면책 | [#12](https://github.com/plancy-dev/elevate/issues/12) (closed) | 추정 상수 보류 — 실요금 교체는 제품·법무 후 |
| P1 씬 테이블 | [#6](https://github.com/plancy-dev/elevate/issues/6) (open) | 씬·초·추정·비주얼·나레이션·모바일 스택·상태 |
| P2 렌더 전 확인 모달 | [#7](https://github.com/plancy-dev/elevate/issues/7) (open) | Primary → 준비 성공 시 모달 → 확정 시 렌더 |
| P3 포맷·예산 가드(제품) | [#8](https://github.com/plancy-dev/elevate/issues/8) (open) | `FORMAT_SPECS` 힌트·Preflight·`scene-budget-constants` |

---

## 관련 GitHub 이슈 (참고)

히스토리·마일스톤용으로 열린 이슈들([#4](https://github.com/plancy-dev/elevate/issues/4)–[#9](https://github.com/plancy-dev/elevate/issues/9) 등)은 필요 시 정리·닫기. **레포에는 디자인 툴 산출물을 두지 않는다.**

---

*업데이트: 문서·프로세스 정리 시 갱신.*
