# Studio · Scene render 에픽 — 상태 스냅샷

SoT 링크: [`.github/DESIGN.md`](../../.github/DESIGN.md) · 프로세스: [`docs/DEV_PROCESS_GITHUB.md`](../DEV_PROCESS_GITHUB.md) · 에픽 [#1](https://github.com/plancy-dev/elevate/issues/1).

**정책:** Figma **대표 프레임**은 사람이 확정; `pnpm figma:list-links:*`는 후보 URL만 제공한다.

---

## 순차 작업 백로그 (권장 순서)

> 사람/디자인이 필요한 단계와 코드 작업을 한 줄에 구분했습니다. **순서대로** 진행하면 의존성이 꼬이지 않습니다.

1. **에픽·브랜치 정렬** — [#1](https://github.com/plancy-dev/elevate/issues/1) 기준으로 현재 마일스톤(P0→P3) 확인; 작업 브랜치는 `epic/scene-render` 또는 `feat/studio-scene-*` 등 팀 규칙에 맞출 것.
2. **Figma #4 파일 구조** — 캔버스·커버 수락 기준 충족 시 이슈 닫기; [`.github/DESIGN.md`](../../.github/DESIGN.md) 표 주석만 필요 시 보강 (사람).
3. **Figma #5 P0 Cost** — 비용 요약·면책·단가 자리 프레임 확정 후 닫기 (사람).
4. **#6 P1 씬 테이블 — 제품·디자인 싱크**
   - 코드: [`scene-render-pipeline-step.tsx`](../../src/components/dashboard/scene-render-pipeline-step.tsx) — 씬별 추정·합계·**lg+ 나레이션 열**·**모바일 Visual/나레이션 스택 행**·여백 조정 등 반영됨.
   - GitHub: **디자인 QA 코멘트** 붙이기(여백·모바일 Visual·나레이션 정책) → 스크린샷으로 Figma 대표 프레임과 비교 → 수락 시 [#6](https://github.com/plancy-dev/elevate/issues/6) 닫기 (사람 + 검수).
5. **Runway 단가 보정** — [공식 API 가이드](https://docs.dev.runwayml.com/guides/pricing/)·대시보드와 [`runway-scene-credits-estimate.ts`](../../src/lib/studio-integrations/providers/runway/runway-scene-credits-estimate.ts) 상수 정합; i18n 면책 문구 유지 (코드).
6. **`type/feature` 이슈 생성** — P2 Preflight [#7](https://github.com/plancy-dev/elevate/issues/7)용: 렌더 전 확인 모달·부분 실패 UX; `Refs #1` (관리).
7. **P2 Preflight 구현** — 이슈 수락 기준에 맞춰 모달/스텝·카피·상태 연동 (코드·PR).
8. **`type/feature` 이슈 생성** — P3 포맷·예산 가드 [#8](https://github.com/plancy-dev/elevate/issues/8); duration budget·UI 상한 (관리).
9. **P3 구현** — 포맷 프리셋·총 예산 가드·기존 budget 토스트와 일관성 (코드·PR).
10. **Figma #9 Explorations** — 실험 프레임 유지 여부 확정 후 닫기 (사람).
11. **에픽 마무리** — [#1](https://github.com/plancy-dev/elevate/issues/1)에서 남은 체크리스트·문서·CHANGELOG 반영 후 클로즈 (관리).

**자동화 점검(병행 가능):** `pnpm figma:verify`, `pnpm verify` — PR 전 필수.

---

## 제품 코드 (merged)

| Item | Issue | Notes |
|------|--------|--------|
| 렌더 전 예상 크레딧 UI + 면책 | [#12](https://github.com/plancy-dev/elevate/issues/12) (closed) | 단가는 [`runway-scene-credits-estimate.ts`](../../src/lib/studio-integrations/providers/runway/runway-scene-credits-estimate.ts) — Runway 정책에 맞게 주기적 보정 |
| P1 씬 테이블 | [#6](https://github.com/plancy-dev/elevate/issues/6) (open) | 씬·초·추정·비주얼·(lg+) 나레이션·모바일 스택·렌더 시 상태 컬럼; **Figma 사인오프·이슈 코멘트 QA** 남음 |

---

## Figma (`type/figma`) — 열린 이슈

| Issue | Focus | 남은 일 (수락 기준 기준) |
|-------|--------|---------------------------|
| [#4](https://github.com/plancy-dev/elevate/issues/4) | 파일 구조·커버 | 디자인이 수락 기준을 만족하면 이슈 닫기 + 필요 시 표 주석 보강 |
| [#5](https://github.com/plancy-dev/elevate/issues/5) | P0 Cost 프레임 | 비용 요약·면책·단가 자리가 프레임에서 완성되면 닫기 |
| [#6](https://github.com/plancy-dev/elevate/issues/6) | P1 씬 테이블 | 위 **순차 백로그 4·5** 완료 후 닫기 |
| [#7](https://github.com/plancy-dev/elevate/issues/7) | P2 Preflight | 프레임·플로우 확정 후 닫기 |
| [#8](https://github.com/plancy-dev/elevate/issues/8) | P3 포맷·예산 가드 | 동일 |
| [#9](https://github.com/plancy-dev/elevate/issues/9) | Explorations | 최소 1프레임 실험 유지 시 닫기 |

`DESIGN.md` 표에 링크가 있어도 **시각 디자인 미완이면 이슈는 열린 채**로 두는 것이 일반적이다.

---

## 권장 다음 `type/feature` 후보 (이슈 미생성 시)

에픽 마일스톤과 정합하게, Figma·[#12](https://github.com/plancy-dev/elevate/issues/12)와 별도로 열 수 있는 구현 후보:

1. **P2 — Preflight**: 렌더 전 확인 모달/스텝, 부분 렌더·실패 안내 카피 및 상태.
2. **P3 — 포맷 프리셋·예산 가드**: 에피소드 포맷과 총 예산 상한 UI, 기존 duration budget과 연동.

각 항목은 별도 이슈 + `Refs #1` + 마일스톤 매핑 후 PR.

---

*업데이트: 에이전트가 문서·프로세스 정리 시 갱신. 최종 우선순위는 팀 에픽 논의에 따른다.*
