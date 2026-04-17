# Studio · Scene render 에픽 — 상태 스냅샷

SoT 링크: [`.github/DESIGN.md`](../../.github/DESIGN.md) · 프로세스: [`docs/DEV_PROCESS_GITHUB.md`](../DEV_PROCESS_GITHUB.md) · 에픽 [#1](https://github.com/plancy-dev/elevate/issues/1).

**정책:** Figma **대표 프레임**은 사람이 확정; `pnpm figma:list-links:*`는 후보 URL만 제공한다.

---

## Figma 파일 API 점검 (로컬·토큰 있을 때)

`GET /v1/files/qxCqUDg8XcC3bEwuR2ImwV` 기준으로 **캔버스별 top-level 노드가 0이면 해당 페이지는 비어 있는 것**으로 본다. (이슈 #4·#5·#9 **디자인 클로즈**에는 각 페이지에 FRAME 등 작업물이 있어야 함.)

재현: 로컬 `.env.local`에 `FIGMA_ACCESS_TOKEN` 설정 후 `pnpm figma:list-links` 또는 Node에서 동일 API 호출.

---

## 순차 작업 백로그 (권장 순서)

1. **에픽·브랜치 정렬** — [#1](https://github.com/plancy-dev/elevate/issues/1) 마일스톤(P0→P3) 확인.
2. **Figma [#4](https://github.com/plancy-dev/elevate/issues/4)** — 페이지·커버에 실제 프레임이 생기면 수락 기준 충족 → 닫기.
3. **Figma [#5](https://github.com/plancy-dev/elevate/issues/5)** — P0 Cost 프레임이 비어 있지 않으면 수락 → 닫기.
4. **[#6](https://github.com/plancy-dev/elevate/issues/6)** — **워크플로:** 대표 프레임 `node-id=` 링크·체크리스트까지면 **절차상 충분**할 수 있음. 추가 **픽셀/카피 QA**는 팀이 원할 때만(필수 아님). 제품 측 테이블·반응형은 코드에 반영됨.
5. **Runway 추정 상수를 실요금에 맞게 교체** — **보류.** 제품·법무 합의 전까지 **스케줄에 올리지 않음** (코드 주석·본 문서 참고). 면책 문구는 유지.
6. **[#7](https://github.com/plancy-dev/elevate/issues/7) P2 Preflight** — 렌더 전 **확인 모달**(씬 수·추정 크레딧·총 길이·소프트 예산 경고·면책) **구현됨** (`scene-render-pipeline-step.tsx`). 남음: Figma 프레임과 카피 합의, 부분 렌더/실패 UX는 별도 스코프.
7. **[#8](https://github.com/plancy-dev/elevate/issues/8) P3** — 포맷 프리셋·예산 가드 UI·기존 duration budget과의 일관성 — **별도 PR** (미구현).
8. **Figma [#9](https://github.com/plancy-dev/elevate/issues/9)** — Explorations에 프레임이 있으면 수락 → 닫기.
9. **에픽 [#1](https://github.com/plancy-dev/elevate/issues/1) 마무리** — 체크리스트·CHANGELOG 후 클로즈.

**병행:** `pnpm figma:verify`, `pnpm verify`.

---

## 제품 코드 (merged)

| Item | Issue | Notes |
|------|--------|--------|
| 렌더 전 예상 크레딧 UI + 면책 | [#12](https://github.com/plancy-dev/elevate/issues/12) (closed) | 추정 상수: [`runway-scene-credits-estimate.ts`](../../src/lib/studio-integrations/providers/runway/runway-scene-credits-estimate.ts) — **실요금 수치 교체는 보류** |
| P1 씬 테이블 | [#6](https://github.com/plancy-dev/elevate/issues/6) (open) | 씬·초·추정·비주얼·(lg+) 나레이션·모바일 스택·상태 |
| P2 렌더 전 확인 모달 | [#7](https://github.com/plancy-dev/elevate/issues/7) (open) | Primary 실행 → 준비 성공 시 모달 → 확정 시 렌더 |

---

## Figma (`type/figma`) — 열린 이슈

| Issue | Focus | 비고 |
|-------|--------|------|
| [#4](https://github.com/plancy-dev/elevate/issues/4) | 파일 구조·커버 | API상 빈 페이지면 먼저 작업물 추가 |
| [#5](https://github.com/plancy-dev/elevate/issues/5) | P0 Cost | 동일 |
| [#6](https://github.com/plancy-dev/elevate/issues/6) | P1 씬 테이블 | 대표 링크 + 선택적 픽셀 QA |
| [#7](https://github.com/plancy-dev/elevate/issues/7) | P2 Preflight | 모달 구현됨; Figma·나머지 UX |
| [#8](https://github.com/plancy-dev/elevate/issues/8) | P3 포맷·예산 가드 | 미구현 |
| [#9](https://github.com/plancy-dev/elevate/issues/9) | Explorations | 동일 |

---

*업데이트: 에이전트가 문서·프로세스 정리 시 갱신.*
