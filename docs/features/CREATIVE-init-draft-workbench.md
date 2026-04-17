# CREATIVE — 훅·제목·대본 워크벤치 (INIT 1차)

**전제:** [`INIT-pipeline-quality-upstream-of-runway.md`](./INIT-pipeline-quality-upstream-of-runway.md) §4 PLAN 고정안을 따른다.  
**목표:** Runway 이전 단계에서 **재사용 가능한 사전 컨텍스트**와 **이번 생성만의 방향**을 UI 상에서 구분해, 실수 없이 고품질 프롬프트를 쌓을 수 있게 한다.

---

## 1. 설계 원칙

1. **두 층의 브리핑** — 사용자 머릿속 모델과 `buildDraftPrompt` 우선순위를 일치시킨다.  
   - **에피소드에 남기는 맥락** (`stickyContext`, `pipeline_prefs.draftWorkbench`) — 여러 번 생성해도 유지.  
   - **이번 생성만** (`draft_briefing` → `userBriefing`) — 항상 최우선(주제·톤 덮어쓰기).

2. **브랜드 가이드는 편집하지 않는다** — SoT는 프로젝트 설정. 생성 시 서버에서 주입(§4.4); UI는 **읽기 전용 알림**으로만 노출해 중복 편집·혼란을 막는다.

3. **기존 DS 유지** — `EpisodeDraftWorkbench`의 `rounded-xl` 카드, `text-[11px]` 라벨, `FieldSelect` + `details/summary` 보조 설명 패턴을 그대로 확장한다.

4. **용량·비용 투명성** — `stickyContext`는 서버/상한과 맞출 것(예: 브리핑과 동일 12k 또는 별도 상수). 초과 시 인라인 검증 메시지(빌드에서 구현).

---

## 2. 정보 구조 (생성 탭)

위에서 아래로 **인지 부하가 낮은 순**으로 배치한다.

| 구역 | 내용 | 비고 |
|------|------|------|
| A | LLM 제공자·모델 | 기존 블록 유지 |
| B | 탭 (생성 / 다듬기 / 편집·저장) | 기존 |
| C | 생성 모드 (DEVELOP / FRESH) | 기존 |
| D | 초안 스타일 템플릿 | 기존 (조직 커스텀 포함) |
| E | **에피소드 맥락 (sticky)** — 신규 | `stickyContext` 텍스트 영역 + **에피소드에 저장** 액션 |
| F | **이번 생성 방향** — 기존 `draft_briefing` 라벨 강화 | placeholder·힌트로 “한 번만 적용” 의미 명시 |
| G | 생성 버튼 | 기존 |

**라벨 권장 (i18n 키는 BUILD에서 `Dashboard.productions`에 추가):**

- Sticky: 제목 예) `에피소드에 남기는 맥락` / 부제 예) `이 에피소드에서 여러 번 생성할 때 공통으로 쓸 타깃·톤·금지어·레퍼런스`  
- Briefing: 제목 예) `이번 생성에만 반영할 방향` / 부제 예) `최우선으로 적용됩니다. Sticky·템플릿보다 위입니다.`

**시각적 구분:** Sticky는 **테두리만 살짝 다른** `border-border-subtle/70 bg-layer-02/20` 카드(템플릿 블록과 동일 계열) 안에 두되, **아이콘** `Layers` 또는 `Pin` 정도로만 구분(과한 색 금지).

---

## 3. 브랜드 가이드 (읽기 전용)

- **위치:** 생성 탭에서 **템플릿(D)과 Sticky(E) 사이** 또는 **LLM 블록(A) 바로 아래** 얇은 한 줄.  
- **내용:**  
  - 프로젝트에 `brand_guide`가 있으면: “프로젝트 브랜드 가이드가 AI 프롬프트에 포함됩니다.” + (선택) “프로젝트에서 수정” 링크 → 프로젝트 설정 경로.  
  - 없으면: 아무것도 안 보이거나 접을 수 있는 힌트 한 줄만.  
- **금지:** 이 다이얼로그 안에서 `brand_guide` 본문 전체를 편집하는 폼을 두지 않는다.

---

## 4. 저장 동작 (UX)

- **Sticky:** “에피소드에 저장”은 `pipeline_prefs.draftWorkbench`만 갱신하는 서버 액션(또는 기존 merge 프리즈와 동일 패턴). 생성 버튼과 **분리**해, 사용자가 “맥락만 고치고 나중에 생성”할 수 있게 한다.  
- **낙관적 UI (선택):** 저장 성공 시 토스트; `dirty`는 `onDirtyChange`에 sticky 미저장 포함 여부를 부모가 알 수 있으면 다이얼로그 닫기 경고에 활용.  
- **초기 로드:** 에피소드 페이지에서 이미 `pipeline_prefs`를 넘기므로, 워크벤치는 prop으로 `initialDraftWorkbench` 또는 상위에서 hydrate — **단일 소스**는 서버에서 내려온 `episode.pipeline_prefs`.

---

## 5. 접근성

- Sticky·이번 방향 각각 `label` + `aria-describedby`로 힌트 문단 연결.  
- 저장 버튼은 `aria-busy` / 로딩 시 `disabled` 일관.  
- 키보드: 생성 탭 내 포커스 순서는 위 표 E→F→G.

---

## 6. 2차 파이프라인 모달과의 패턴 정렬 (참고)

Runway·TTS 등 **같은 “고급 / 사전 컨텍스트” 카드**를 쓸 때:

- **접두·접미**가 이미 있으면(예: `visualPromptSuffix`) 라벨만 통일: “항상 붙는 접미” vs “이번 실행만”.  
- JSON 사전 데이터(`preDataJson`)는 **CREATIVE 2차**: 폼 빌더 대신 단일 textarea + 서버 검증 또는 접이식 JSON — INIT 1차에서는 **sticky 텍스트만**으로 충분하면 미구현.

---

## 7. 비목표 (이 CREATIVE 문서 범위 밖)

- 다듬기 탭에 `stickyContext` 주입(§4.1에서 2차).  
- 조직 템플릿 편집 UX 변경(`DraftTemplateManageDialog`는 유지).  
- PostHog 이벤트 스키마 변경(필요 시 BUILD에서 별도).

---

## 8. BUILD 체크리스트 (구현 시)

- [ ] `messages/en.json` + `ko.json` (+ parity 테스트) — 새 라벨·힌트·브랜드 스트립.  
- [ ] `draftWorkbenchPrefsFromPipelinePrefs` + merge 액션 또는 기존 prefs 액션 확장.  
- [ ] `buildDraftPrompt`에 `stickyContext` + `brandGuide` 연결 + `episode-llm-prompt.test.ts` 갱신.  
- [ ] 워크벤치: Sticky 필드, 저장, hydrate, (선택) 미저장 경고.

---

*작성: INIT CREATIVE 단계 — §4 PLAN과 대응.*
