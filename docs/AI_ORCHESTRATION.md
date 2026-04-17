# AI 오케스트레이션 — Elevate (단일 허브)

이 문서는 **Cursor / Claude / gstack**을 섞어 쓸 때의 **역할 분담**과 **의사결정 기준**이다.  
업계에서 널리 쓰는 패턴과 맞춘다: **도구별 프롬프트 템플릿(gstack)** + **프로젝트 맥락 단일 소스(memory-bank)** + **저장소 비가역 규칙(AGENTS·hooks)**.

---

## 1. 세 레이어 (충돌 시 위에서 아래로)

| 레이어 | 위치 | 역할 |
|--------|------|------|
| **A. 제약** | `AGENTS.md`, `.cursor/rules/*`, Conventional Commits·pre-commit | 구현·커밋·Next.js 16 주의 — **항상 우선** |
| **B. 프로젝트 상태** | `memory-bank/` (`tasks.md`, `activeContext.md`, `creative-elevate-ai-pivot.md` 등) | **무엇을 왜 만드는지**, 우선순위, 도메인 용어 — **gstack으로 대체하지 않음** |
| **C. 에이전트 워크플로** | **gstack** (`.agents/skills/gstack`, `./setup` 후 슬래시 스킬) | **어떻게 생각·검토·출하할지** — CEO/엔지/디자인/QA 등 구조화된 역할 |

- **memory-bank를 gstack으로 “이전”하지 않는다.** gstack은 범용 스킬 모음이고, Elevate의 로드맵·North Star는 저장소 내부 문서가 맞다.
- **gstack을 memory-bank에 복제하지 않는다.** 스킬 목록·철학은 vendored `gstack` README / `CLAUDE.md` § gstack을 참조한다.

---

## 2. 언제 무엇을 쓰나 (요약)

| 상황 | 권장 |
|------|------|
| 일반 구현·버그 수정 | Cursor **INIT→PLAN→BUILD** (`workflow-modes.mdc`) + `memory-bank/tasks.md` |
| 아이디어·제품 방향을 압축하고 싶음 | gstack **`/office-hours`** 또는 **`/plan-ceo-review`** → 결과를 North Star·`tasks.md`에 반영 |
| 아키텍처·엣지 케이스 확정 | **`/plan-eng-review`** (또는 Cursor Plan) → ADR·`creative-architecture.md` |
| 랜딩·UI 품질 | **`/plan-design-review`** + 필요 시 `ui-ux-pro-max` 스킬 |
| **UI·제품 피처 — 전체 순서** | **[`docs/design/QUALITY_PIPELINE.md`](design/QUALITY_PIPELINE.md)** (디자인 플랜 리뷰 → 엔지 플랜 리뷰 → 빌드 → verify) |
| PR 전 품질·리그레션 | **`/review`**; 브라우저 검증은 **`/qa`** 또는 **`/browse`** (설치 시) |
| 출하 파이프라인 | **`/ship`** — 단, **이 저장소는 `pnpm verify`·커밋 규칙을 반드시 지킨다** (gstack 기본과 다를 수 있음) |

---

## 3. 프롬프트 엔지니어링 계약 (에이전트에게 줄 맥락)

세션 시작 또는 큰 작업 전에 **최소한** 다음을 붙인다:

1. **목표 한 줄** + **범위(파일/기능)**  
2. **`memory-bank/tasks.md`에서 해당 체크박스** 또는 인용  
3. **`memory-bank/activeContext.md`의 “다음 앵커”** (있다면)  
4. 제품 방향이 흔들리면 **`memory-bank/creative-elevate-ai-pivot.md`** 한 단락 인용  

불필요한 전체 붙여넣기 대신 **파일 경로를 주고 읽게 한다** — 컨텍스트 비용과 드리프트를 줄인다.

---

## 4. gstack 설치·목록

- **설치·Bun·충돌 회피**: [`docs/GSTACK.md`](./GSTACK.md)  
- **스킬 인벤토리(긴 목록)**: 루트 [`CLAUDE.md`](../CLAUDE.md) 또는 vendored [`.agents/skills/gstack/AGENTS.md`](../.agents/skills/gstack/AGENTS.md)

---

## 5. Cursor 워크플로와의 매핑 (비파괴)

| Cursor 모드 | gstack과의 관계 |
|---------------|-----------------|
| INIT | 스코프·복잡도 파악; 필요 시 이후 `/plan-*`로 심화 |
| PLAN | `/plan-eng-review`와 **경쟁이 아니라 보완** — Plan 모드로 초안 → 엔지 리뷰 스킬로 구멍 찾기 가능 |
| BUILD | 구현; 완료 후 `pnpm verify` |
| REFLECT | 문서·체크리스트; gstack **`/retro`**는 팀 습관용으로 선택 |

---

## 6. 금지·주의

- **환경 변수·키를 프롬프트에 넣지 않는다** — `.env.local`만.  
- **gstack만으로 커밋 훅을 건너뛰지 않는다** — `commit-verification` 규칙 유지.  
- **PostHog·피처 플래그** — `.cursor/rules/posthog-integration.mdc` 준수.

---

## 7. 관련 문서

| 문서 | 용도 |
|------|------|
| [`AI_USAGE.md`](./AI_USAGE.md) | 짧은 진입점 |
| [`GSTACK.md`](./GSTACK.md) | vendored gstack 설치 |
| [`DEVELOPMENT.md`](./DEVELOPMENT.md) | 스크립트·CI·대시보드 접근 env |
| [`design/SYSTEM.md`](./design/SYSTEM.md) | 디자인 토큰·마케팅/앱 셸 |
| [`memory-bank/README.md`](../memory-bank/README.md) | Memory Bank 파일 역할 |
| [`AI_AGENT_MATURITY_REPORT.md`](./AI_AGENT_MATURITY_REPORT.md) | 성숙도 리포트·벤치마크·점수 |
| [`design/QUALITY_PIPELINE.md`](./design/QUALITY_PIPELINE.md) | gstack 디자인·엔지 리뷰 순서 + repo 게이트 |
| [`DEV_PROCESS_GITHUB.md`](./DEV_PROCESS_GITHUB.md) | **GitHub Issues / PR / Figma / gh CLI** — 원격 작업 추적·에픽·`pnpm issues:studio` |

---

## 8. 자동화 (버그·기능 요청도 동일 동작)

- **Cursor**: `.cursor/rules/ai-session-bootstrap.mdc` (`alwaysApply: true`) — 구현·버그·기능 요청 시 **`memory-bank/tasks.md`·`activeContext.md`**를 도구로 읽고, **`docs/AI_ORCHESTRATION.md`** 레이어를 확인한 뒤 진행. 사용자가 템플릿을 쓰지 않아도 동작한다.
- **사용자 권장 형식** (재현·범위 명확화): [`AI_USER_TEMPLATES.md`](./AI_USER_TEMPLATES.md).

---

## 9. 다른 프로젝트로 복제

최소 변경으로 옮기려면 **`docs/AI_WORKFLOW_PORTABILITY.md`** 의 Tier B 체크리스트를 따른다. (경로·`pnpm verify`·North Star 파일명 등)
