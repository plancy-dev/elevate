# REFLECT — 파이프라인 초안 다이얼로그 (G3.1.2)

**Date:** 2026-04-17  
**SoT:** [`tasks.md`](../../tasks.md) § G3.1.2 · [`creative-pipeline-draft-dialog-2026-04.md`](creative-pipeline-draft-dialog-2026-04.md)

---

## Success criteria (PLAN/CREATIVE vs shipped)

| Criterion | Result |
|-----------|--------|
| 파이프라인 1단계에서 초안 편집 without 탭 이동 | ✅ `PreprodDraftStepRow` + `Modal` + `EpisodeDraftWorkbench` `variant="dialog"` |
| draft 탭과 **기능 동등**(생성·다듬기·비교·템플릿·저장·스냅샷) | ✅ 동일 워크벤치 모듈; 레퍼런스·중첩 파이프라인만 `afterRefineSlot`으로 패널 전용 |
| DB/액션 변경 없음 | ✅ |
| 다이얼로그 **열릴 때만** 워크벤치 마운트 | ✅ `draftDialogOpen && canEditDraft`일 때만 children |
| 미저장 닫기 확인 | ✅ 두 번째 `Modal` `stackClassName` z-[90]; 상위 `onClose`에서 `draftCloseConfirmOpen` 가드 |
| DS: `Modal` 확장, 단일 스크롤 본문 | ✅ `size="2xl"`; CREATIVE 푸터 링크 → `episodePanel=draft` |
| i18n 5 로케일 | ✅ en/ko/ja/zh-CN/zh-TW |
| 순환 import 제거 | ✅ `episode-draft-workbench.tsx`가 `ProductionEpisodePipeline` 미import |

---

## Lessons

1. **추출 위치:** `afterRefineSlot`으로 레퍼런스·중첩 파이프라인만 밖으로 빼면 워크벤치가 `pipeline`을 import하지 않아 순환이 끊긴다.
2. **중첩 모달:** Esc·백드롭이 두 `Modal`에 동시에 걸리므로, 확인 모달이 열려 있을 때 본문 모달의 `onClose`에서 **조기 return**이 필요하다.
3. **ID 충돌:** 숨김 draft 패널과 동시에 존재할 수 있어 `variant === "dialog"`일 때 `fieldIds` 접두로 분리했다.
4. **`Modal` 확장:** 재사용 모달에 `stackClassName`·`titleId`·`2xl`을 넣어 스택·a11y를 맞췄다.

---

## Gaps / not verified in CI

- **수동 스모크:** 로컬에서 파이프라인 탭 → 편집 → 저장 → 진행률/다음 단계 라벨, `DraftTemplateManageDialog`가 초안 모달 위에 올라오는지 **브라우저에서 한 번** 확인하는 것이 좋다.
- **PostHog:** 다이얼로그 오픈 이벤트는 PLAN에서 선택·2차로 남김.
- **`canEditDraft === false`:** 카드에서 편집 버튼 숨김; draft 탭 읽기 전용과 동일 정책 — 엣지 케이스는 운영 피드백 시.

---

## Follow-ups (optional)

- [ ] `ELEVATE_STUDIO_PIPELINE_DRAFT_DIALOG_OPENED` (PostHog) — 제품이 메트릭을 원할 때.
- [ ] 포커스 트랩 / 첫 필드 포커스 — CREATIVE에서 “BUILD 검토”; 미구현 시 후속 Polish.
- [ ] [`creative-pipeline-draft-dialog-2026-04.md`](creative-pipeline-draft-dialog-2026-04.md) §8 BUILD 검수 체크리스트를 스테이징에서 스크린샷으로 한 번 체크.
