# Studio · Scene render 에픽 — 상태 스냅샷

SoT 링크: [`.github/DESIGN.md`](../../.github/DESIGN.md) · 프로세스: [`docs/DEV_PROCESS_GITHUB.md`](../DEV_PROCESS_GITHUB.md) · 에픽 [#1](https://github.com/plancy-dev/elevate/issues/1).

**정책:** Figma **대표 프레임**은 사람이 확정; `pnpm figma:list-links:*`는 후보 URL만 제공한다.

---

## 제품 코드 (merged)

| Item | Issue | Notes |
|------|--------|--------|
| 렌더 전 예상 크레딧 UI + 면책 | [#12](https://github.com/plancy-dev/elevate/issues/12) (closed) | 단가는 [`runway-scene-credits-estimate.ts`](../../src/lib/studio-integrations/providers/runway/runway-scene-credits-estimate.ts) — Runway 정책에 맞게 주기적 보정 |
| P1 씬 테이블(씬별 추정·합계) — 초기 구현 | [#6](https://github.com/plancy-dev/elevate/issues/6) (open) | [`scene-render-pipeline-step.tsx`](../../src/components/dashboard/scene-render-pipeline-step.tsx): 유효한 Scenes JSON일 때 씬·초·추정 크레딧·비주얼(말줄임) 테이블; 렌더 시작 후 상태 컬럼·Figma 시각과 정합은 이슈에서 마무리 |

---

## Figma (`type/figma`) — 열린 이슈

| Issue | Focus | 남은 일 (수락 기준 기준) |
|-------|--------|---------------------------|
| [#4](https://github.com/plancy-dev/elevate/issues/4) | 파일 구조·커버 | 디자인이 수락 기준을 만족하면 이슈 닫기 + 필요 시 표 주석 보강 |
| [#5](https://github.com/plancy-dev/elevate/issues/5) | P0 Cost 프레임 | 비용 요약·면책·단가 자리가 프레임에서 완성되면 닫기 |
| [#6](https://github.com/plancy-dev/elevate/issues/6) | P1 씬 테이블 | 씬별 추정·합계 UX가 프레임에 반영되면 닫기 |
| [#7](https://github.com/plancy-dev/elevate/issues/7) | P2 Preflight | 프레임·플로우 확정 후 닫기 |
| [#8](https://github.com/plancy-dev/elevate/issues/8) | P3 포맷·예산 가드 | 동일 |
| [#9](https://github.com/plancy-dev/elevate/issues/9) | Explorations | 최소 1프레임 실험 유지 시 닫기 |

`DESIGN.md` 표에 링크가 있어도 **시각 디자인 미완이면 이슈는 열린 채**로 두는 것이 일반적이다.

---

## 권장 다음 `type/feature` 후보 (이슈 미생성)

에픽 마일스톤과 정합하게, Figma·[#12](https://github.com/plancy-dev/elevate/issues/12)와 별도로 열 수 있는 구현 후보:

1. **P1 — 씬 테이블**: 씬별 추정 비용/크레딧 열, 합계 행(또는 요약 바) — 대시보드 [`scene-render-pipeline-step`](../../src/components/dashboard/scene-render-pipeline-step.tsx) 확장.
2. **P2 — Preflight**: 렌더 전 확인 모달/스텝, 부분 렌더·실패 안내 카피 및 상태.
3. **P3 — 포맷 프리셋·예산 가드**: 에피소드 포맷과 총 예산 상한 UI, 기존 duration budget과 연동.

각 항목은 별도 이슈 + `Refs #1` + 마일스톤 매핑 후 PR.

---

*업데이트: 에이전트가 문서·프로세스 정리 시 갱신. 최종 우선순위는 `memory-bank/tasks.md`와 에픽 논의에 따른다.*
