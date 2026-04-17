# INIT — Runway 이전 단계 품질 (콘텐츠 파이프라인)

**상태:** 1차 BUILD 완료 (훅·제목·대본: sticky + brand guide) · REFLECT: [`memory-bank/archive/work-history/reflect-init-upstream-draft-quality-2026-04.md`](../../memory-bank/archive/work-history/reflect-init-upstream-draft-quality-2026-04.md)  
**목표:** Runway 씬 렌더(가장 비용 큰 구간)에 도달했을 때, **그 전 단계 산출물**이 이미 충분히 정제되어 있도록 UX·프롬프트·사전 데이터 구조를 연다.

**비목표 (이 INIT에서 다루지 않음):** PostHog 대시보드, 마케팅 캘린더, `tasks.md`에만 있는 타 제품 백로그 — 조회는 [`docs/internal/BACKLOG_INDEX.md`](../internal/BACKLOG_INDEX.md).

---

## 1. 배경

- 파이프라인: 훅·제목·대본 → (TTS·자막·씬 계획 등) → **Runway 영상 생성** → 조립 → YouTube.
- 비용·실패 비용이 가장 큰 구간은 **Runway**; 그래서 **앞 단계에서 품질을 올리면** 재렌더·폐기 비용을 줄일 수 있다.

---

## 2. 범위 (합의 초안)

### 2.1 1차 — 훅·제목·대본 (`EpisodeDraftWorkbench` / 초안 다이얼로그)

- **사용자 의도:** “INIT에서 퀄리티를 높인 뒤 Runway로 넘긴다”에 맞춤.
- **방향:**
  - 이미 있는 **브리핑**·**템플릿**·**스냅샷** 위에, 단계별로 재사용 가능한 **커스텀 지시**(프롬프트 블록 / 사전 컨텍스트) 슬롯을 둔다.
  - “조회만”이 아니라 **저장·재사용**이 되는 필드로 설계 — 스코프·저장 위치는 **§4** 고정안 따름.
- **코드 앵커:** [`src/lib/studio-productions/episode-llm.ts`](../../src/lib/studio-productions/episode-llm.ts) `buildDraftPrompt` · [`production-episode-draft-panel.tsx`](../../src/components/dashboard/production-episode-draft-panel.tsx) · [`studio-episode-llm.ts`](../../src/actions/studio-episode-llm.ts)  
- **문서 참고:** `memory-bank/tasks.md` § G3.4 (템플릿·바이어스), G3.4 P3는 선택.

### 2.2 2차 — 다른 파이프라인 모달 (TTS·씬 플랜·조립 등)

- 현재 **보기 위주**인 모달/고급 패널에 동일 패턴 적용: **선택적 커스텀 프롬프트 / 접두·접미 / 사전 데이터(JSON 또는 텍스트)**.
- Runway 단계에는 이미 **브랜드 가이드 병합·비주얼 접미** 등이 있음 — 여기와 **중복 없이** 같은 “확장 필드” 패턴을 쓸지 CREATIVE에서 정함.

### 2.3 오류·경고

- 브라우저 `MISSING_MESSAGE` — `messages/*.json`과 `Dashboard.productions` 네임스페이스 정합; **`pnpm exec vitest run tests/unit/messages-locale-parity.test.ts`** 로 en 대비 누락 검증.
- 로컬에서 여전히 뜨면 **dev 서버 재시작**·하드 리프레시.

---

## 3. 권장 워크플로 (Memory Bank)

| 순서 | 모드 | 산출 |
|------|------|------|
| 1 | **PLAN** | 필드·스코프·저장·주입 — **§4 고정안** |
| 2 | **CREATIVE** | [`CREATIVE-init-draft-workbench.md`](./CREATIVE-init-draft-workbench.md) — 정보 구조·DS·접근성 |
| 3 | **BUILD** | 구현 + `pnpm verify` |
| 4 | **REFLECT** | 재렌더 감소·편집 시간 등 성공 기준 |

---

## 4. PLAN 고정 (필드 · 스코프 · 저장 위치 · `buildDraftPrompt` 주입)

아래는 **구현 착수 전**에 고정한 결정이다. 스키마 마이그레이션은 **불필요** — `pipeline_prefs` JSONB와 기존 org 템플릿 테이블만 사용한다.

### 4.1 필드 (슬롯)

| 슬롯 | 의미 | 출처 (현재 또는 INIT) |
|------|------|------------------------|
| **요청 단위 브리핑** | 이번 생성에만 적용되는 방향 (최우선 톤·주제) | 폼 `draft_briefing` → `buildDraftPrompt.userBriefing` (`DRAFT_BRIEFING_MAX_CHARS` = 12k) |
| **생성 모드** | 현재 초안 발전 vs 새 주제 | 폼 `draft_generate_mode` → `generateMode` `develop` \| `fresh` |
| **스타일 바이어스** | 훅/페이싱 구조 편향 (영문 바이어스) | `draft_template_key` → 시드 키 또는 `custom:<uuid>` → `resolveDraftTemplateForGenerate` → `templateBias` |
| **에피소드 메타** | 작업 제목, 크리에이터 노트, 니치·포맷·채널·배포 라벨 | `getStudioEpisodeForOrg` embed → `buildDraftPrompt` 상단 블록 |
| **현재 에디터 초안** | DEVELOP 모드에서만 | `loadEpisodeDraftPayload` → `currentDraft` |
| **프로젝트 브랜드 가이드** | 톤·페르소나·금지 사항 | `episode.studio_projects?.brand_guide` → `buildDraftPrompt.brandGuide` (**함수는 지원하나 생성 액션에서 아직 미전달 — BUILD 시 연결**) |

**INIT에서 추가할 에피소드 고정 컨텍스트 (신규):**

- **`pipeline_prefs.draftWorkbench`** 아래에만 둔다 (키 이름은 구현 시 아래와 동일하게 권장).
  - `stickyContext` (string, 선택): 회차를 넘겨도 유지할 **사전 브리핑** (타깃, 금지어, 레퍼런스 요약 등). 한 번의 생성 요청 브리핑보다 **낮은 우선순위**로 두고, `buildDraftPrompt` 안에서는 **`userBriefing` 아래가 아니라** “이번에만 최우선”인 `userBriefing` **앞**에 삽입하는 블록으로 넣는다 (우선순위: 메타 < 브랜드 가이드 < 템플릿 바이어스 < **stickyContext** < **userBriefing**).
  - (선택 후속) `preDataJson` — 구조화된 사전 데이터; CREATIVE에서 필요 시만 파싱해 동일 블록으로 직렬화.

`refineDraftWithLlm` 경로는 별도 user 프롬프트이며, INIT 1차에서는 **생성** 경로만 확장한다. 다듬기 탭에 sticky를 넣을지는 2차.

### 4.2 스코프: 에피소드 vs 조직

| 레벨 | 무엇을 담는가 |
|------|----------------|
| **조직** | LLM 제공자 API 키 (`studio_org_provider_connections`), **커스텀 초안 템플릿** (`studio_episode_draft_templates`: 이름 + `bias_body`), 시드 템플릿 키 정의 (`draft-prompt-templates.ts`) |
| **에피소드** | 산출물 `hook` / `title` / `script_draft` 아티팩트·스냅샷, **`pipeline_prefs`** (씬 JSON, TTS, Runway 접미 등 + **`draftWorkbench`**) |

에피소드 A의 `stickyContext`는 B에 영향 없음. 조직 템플릿은 같은 org 내 여러 에피소드에서 재사용.

### 4.3 저장 위치

| 데이터 | 저장소 |
|--------|--------|
| 생성 결과 텍스트 | 기존 `studio_production_artifacts` + 스냅샷 테이블 (변경 없음) |
| 파이프라인·워크벤치 UI 상태 | `studio_production_episodes.pipeline_prefs` (JSONB, 상한 `PIPELINE_PREFS_JSON_MAX_BYTES`) |
| org 커스텀 스타일 문구 | `studio_episode_draft_templates` (기존) |

**신규 마이그레이션:** 없음. `draftWorkbench`는 애플리케이션 규약으로 `mergePipelinePrefsPatch`에 넣는다. 타입 헬퍼는 `episode-pipeline-prefs.ts`에 `draftWorkbenchPrefsFromPipelinePrefs` 패턴으로 추가 (BUILD 시).

### 4.4 `buildDraftPrompt` 주입점

- **단일 진입 (생성):** [`src/actions/studio-episode-llm.ts`](../../src/actions/studio-episode-llm.ts) `generateStudioEpisodeDraft` → `buildDraftPrompt({ ... })` (대략 L316 근처).
- **서버에서만 조립:** 클라이언트는 폼 + (선택) `pipeline_prefs` 패치를 보내고, **최종 문자열은 서버**에서만 만든다.
- **프롬프트 블록 순서 (이미 구현된 순서 유지, sticky만 끼워 넣음):**  
  모드 → 에피소드·채널 메타 → (DEVELOP 시) 현재 초안 JSON → 브랜드 가이드 → 템플릿 바이어스 → **← 여기에 `stickyContext` 블록 추가 (INIT)** → Additional direction (`userBriefing`) → URL/JSON 출력 지시.

구체적 시그니처는 BUILD에서 `buildDraftPrompt`에 `stickyContext?: string` 한 인자를 추가하거나, 액션에서 `userBriefing`에 접두어를 붙이는 방식 중 택일 — **권장: 시그니처에 `stickyContext` 명시** (우선순위·테스트가 명확).

- **정합성 갭 (즉시 연결 권장, INIT 범위):** `brandGuide`는 에피소드 로드에 이미 포함되나 생성 액션에서 미전달이므로, **같은 PR/슬라이스에서** `buildDraftPrompt({ ..., brandGuide: episode.studio_projects?.brand_guide ?? undefined })` 로 연결한다.

---

## 5. 다음 액션 (에이전트/인간 공통)

1. `gh` 또는 이슈 템플릿으로 **단일 이슈** 생성: 제목 예) `Studio: INIT upstream quality — draft dialog + pipeline modals` — 본문에 이 문서 링크.
2. **스키마:** 신규 마이그레이션 없음(§4.3). BUILD는 `pipeline_prefs.draftWorkbench` + `buildDraftPrompt` 확장 + `brandGuide` 연결부터.
3. 훅·제목·대본부터 BUILD 슬라이스를 쪼갬 (한 PR이 너무 크지 않게).

---

*작성: 2026-04-17 — INIT 진입 시점.*
