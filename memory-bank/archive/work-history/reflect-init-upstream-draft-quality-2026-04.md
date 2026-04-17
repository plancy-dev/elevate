# REFLECT — INIT upstream quality (훅·제목·대본: sticky + brand guide)

**Date:** 2026-04-17  
**SoT:** [`docs/features/INIT-pipeline-quality-upstream-of-runway.md`](../../../docs/features/INIT-pipeline-quality-upstream-of-runway.md) §4 · [`CREATIVE-init-draft-workbench.md`](../../../docs/features/CREATIVE-init-draft-workbench.md)

---

## Success criteria (PLAN/CREATIVE vs shipped)

| Criterion | Result |
|-----------|--------|
| `buildDraftPrompt`에 `stickyContext` + 우선순위(템플릿 < sticky < 이번 방향) | ✅ `episode-llm.ts` 블록 순서 + 단위 테스트 |
| 생성 시 `brandGuide`를 프로젝트에서 주입 | ✅ `generateStudioEpisodeDraft` → `studio_projects.brand_guide` |
| 에피소드 저장소 `pipeline_prefs.draftWorkbench.stickyContext` | ✅ `draftWorkbenchPrefsFromPipelinePrefs` + `saveEpisodePipelinePrefs` |
| UI: 맥락 textarea · 저장 · 브랜드 읽기 전용 안내 · 이번 생성 라벨 구분 | ✅ `EpisodeDraftWorkbench` 생성 탭 |
| 다이얼로그에 `pipelinePrefs` / `brandGuide` 전달 | ✅ `ProductionEpisodePipeline` |
| 신규 DB 마이그레이션 없음 | ✅ JSONB 규약만 |
| i18n 5 로케일 | ✅ en/ko/ja/zh-CN/zh-TW + parity 테스트 |

---

## Lessons

1. **서버 단일 진입:** sticky는 폼 `draft_sticky_context`로 생성 요청마다 전달되므로, 저장하지 않아도 **그 번 생성**에는 반영된다. 저장은 세션 간·탭 간 일관성용.
2. **brandGuide 타입:** Supabase embed `studio_projects`는 단일 객체로 오지만, 방어적으로 객체·`brand_guide` 키를 검사한 뒤 `buildDraftPrompt`에 넘겼다.
3. **dirty:** `onDirtyChange`에 `stickyContext !== savedStickyContext`를 넣어 다이얼로그 닫기 확인에 미저장 맥락이 포함된다.
4. **테스트:** 프롬프트 순서는 인덱스 비교 테스트로 고정해 회귀를 잡기 쉽다.

---

## Gaps / not verified in CI

- **수동 스모크:** 통합·E2E 없음 — 실제 에피소드에서 sticky 저장 → 새로고침 후 값 유지 → 생성 한 번으로 프롬프트에 브랜드/맥락이 들어가는지 브라우저에서 확인 권장.
- **다듬기 탭:** INIT 1차 범위에서 `refineDraftWithLlm`에는 sticky 미주입(PLAN 그대로).
- **`ProductionEpisodeDraftPanel`:** 레포 내 직접 소비처는 없으나 props 확장만 해 둠 — 나중에 패널만 쓸 때 `pipelinePrefs`/`brandGuide`를 넘기면 동일 UX.

---

## Follow-ups (optional)

- [ ] PostHog: `draftWorkbench` 저장 또는 sticky 길이 분포(제품이 원할 때).
- [ ] 2차 파이프라인 모달(TTS·씬 등)에 동일 “고급 컨텍스트” 패턴 적용 — INIT §2.2.
- [ ] `preDataJson` — CREATIVE에서 보류.

---

## Code anchors (회귀 시)

| Area | Path |
|------|------|
| Prompt | `src/lib/studio-productions/episode-llm.ts` `buildDraftPrompt` |
| Action | `src/actions/studio-episode-llm.ts` `generateStudioEpisodeDraft` |
| Prefs helper | `src/lib/studio-productions/episode-pipeline-prefs.ts` `draftWorkbenchPrefsFromPipelinePrefs` |
| UI | `src/components/dashboard/episode-draft-workbench.tsx` |
| Tests | `tests/unit/episode-llm-prompt.test.ts`, `tests/unit/episode-pipeline-prefs.test.ts` |
