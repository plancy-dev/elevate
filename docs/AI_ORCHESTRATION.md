# AI 오케스트레이션 — Elevate (단일 허브)

이 문서는 **Cursor / Claude / gstack**을 섞어 쓸 때의 **역할 분담**과 **의사결정 기준**이다.  
업계에서 널리 쓰는 패턴과 맞춘다: **도구별 프롬프트 템플릿(gstack)** + **프로젝트 맥락 단일 소스(memory-bank)** + **저장소 비가역 규칙(AGENTS·hooks)** + **선택적 Vercel 플러그인(배포 보조)**.

**하네스(필수 읽기·INIT·턴 종료·Ops vs 제품):** **[§2 세션 하네스 (canonical)](#2-세션-하네스-canonical)** 에만 서술한다. [`AGENTS.md`](../AGENTS.md), [`.cursor/rules/*.mdc`](../.cursor/rules/), 스킬, 다른 `docs/` 는 **중복 서술 대신 여기를 링크**한다.

---

## 1. 레이어 (충돌 시 위에서 아래로; D는 선택)

| 레이어 | 위치 | 역할 |
|--------|------|------|
| **A. 제약** | `AGENTS.md`, `.cursor/rules/*`, Conventional Commits·pre-commit | 구현·커밋·Next.js 16 주의 — **항상 우선** |
| **B. 프로젝트 상태** | `memory-bank/` (`tasks.md`, `activeContext.md`, `creative-elevate-ai-pivot.md` 등) | **무엇을 왜 만드는지**, 우선순위, 도메인 용어 — **gstack으로 대체하지 않음** |
| **C. 에이전트 워크플로** | **gstack** (`.agents/skills/gstack`, `./setup` 후 슬래시 스킬) | **어떻게 생각·검토·출하할지** — CEO/엔지/디자인/QA 등 구조화된 역할 |
| **D. Vercel 플러그인 (선택)** | [Vercel Plugin](https://vercel.com/docs/agent-resources/vercel-plugin) (`npx plugins add vercel/vercel-plugin`) | 배포·환경·Next 맥락 **보조** — **A–C를 대체하지 않음**; 슬래시 관행은 [`AGENTS.md`](../AGENTS.md) § Vercel plugin |

- **memory-bank를 gstack으로 “이전”하지 않는다.** gstack은 범용 스킬 모음이고, Elevate의 로드맵·North Star는 저장소 내부 문서가 맞다.
- **gstack을 memory-bank에 복제하지 않는다.** 스킬 목록·철학은 vendored `gstack` README / `CLAUDE.md` § gstack을 참조한다.
- **Vercel 플러그인**은 배포·env 보조일 뿐이다. **AGENTS / verify / Memory Bank / gstack을 우회하지 않는다** ([`AGENTS.md`](../AGENTS.md) § Vercel plugin).

---

## 2. 세션 하네스 (canonical)

이 절만 **Tier 읽기·INIT 출력 형식·턴 종료·Ops vs 제품 BUILD**의 근거가 된다. ([`AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md) 블록 A의 “필수 3파일”은 아래 **Tier 0**과 동일.)

### 2.1 Tier 0 / Tier 1 (도구로 읽기)

| Tier | 읽을 것 | 언제 |
|------|---------|------|
| **0 (필수)** | `memory-bank/tasks.md`, `memory-bank/activeContext.md`, `docs/AI_ORCHESTRATION.md` | 구현·버그·기능 등 **Memory Bank 부트스트랩이 켜진** 요청(`.cursor/rules/ai-session-bootstrap.mdc`). [`AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md) 블록 A와 동일. |
| **1 (조건부)** | `memory-bank/creative-elevate-ai-pivot.md`(필요 단락만), `memory-bank/domainKnowledge.md`(용어·역사 혼동 시), `docs/DEV_PROCESS_GITHUB.md`(이슈·PR·Studio 큐), 제품/결제 **공식 문서·MCP** | 제품 방향이 질문과 직접 겹침 · MICE/피벗 용어 혼동 · “다음 할 일/이슈 N” · 외부 API/결제/PII |

같은 스레드에서 이미 읽은 파일은 **재읽기 생략** 가능.

### 2.2 INIT 완료 출력 (유일 형식)

`auto-workflow.mdc`의 “INIT 분석” 블록과 `workflow-modes.mdc`는 **이 블록만** 사용한다(문구 통일).

```
✅ INIT 완료
━━━━━━━━━━━━━━━━━━
📁 파일: [n개 또는 탐색 범위]
📊 복잡도: L[1-4]
   - 파일 수: n / 설계: 필요·불필요 / DB: 있음·없음
➡️ 다음: [PLAN 또는 BUILD 등]
```

그 아래 **한 줄**: 권장 Cursor 모드(Ask / Plan / Agent / Debug) + (선택) gstack 슬래시 **최대 1~2개** — [`AGENTS.md`](../AGENTS.md) § AI orchestration → Operating model 표를 따른다.

**INIT 체크리스트 (중복 없음):** Tier 0 읽기(§2.1) → 관련 경로 탐색(좁은 `grep` / Task `explorer`) → L1–L4 선언 → 위 출력. 제안·실행 세션용 문구는 [`AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md) 블록 B~D.

### 2.3 복잡도·페이즈 (기본 체인)

| Level | 기본 페이즈 체인 |
|------|------------------|
| **L1** | INIT → BUILD → REFLECT |
| **L2** | INIT → PLAN → BUILD → REFLECT |
| **L3** | INIT → PLAN → CREATIVE → BUILD → REFLECT |
| **L4** | 전 페이즈 + ARCHIVE (및 필요 시 ADR) |

페이즈 생략·fast path는 [`AGENTS.md`](../AGENTS.md) § Operating model 원칙과 동일(사용자 명시 예외만).

| Phase | Cursor (typical) | 최소 산출 |
|-------|------------------|-----------|
| **INIT** | Ask / short Agent | §2.2 블록 + L1–L4, `tasks`/`activeContext` 정합 |
| **PLAN** | **Plan** | 리스크·검증 아이디어; `tasks.md` 정합 |
| **CREATIVE** | **Plan** | `memory-bank/creative-*`, ADR 또는 `docs/features/…` |
| **BUILD** | **Agent** | §2.6 **제품 BUILD** 게이트 충족 시에만 완료 선언 |
| **REFLECT** | Ask / **Debug** | `progress.md` / `tasks.md` 후속 |
| **ARCHIVE** | Agent | `memory-bank/archive/` 규약 |

### 2.4 턴 종료 (Session handoff)

의미 있는 턴(코드·게이트·`memory-bank`·GitHub 증거 변경)이면 응답 말미에 [`docs/AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md)에서 **블록 A 전문** + 상황에 맞는 **B / C / D 전문**을 **그대로** 출력한다. 단순 Q&A·저장소 무관 한 줄은 생략 가능. 원문은 항상 `AI_EXPERT_PROMPTS.md`에 두고 채팅에는 복붙(스테일 방지: [`AGENTS.md`](../AGENTS.md) Session handoff).

### 2.5 Ops 게이트 vs 제품 BUILD (완료 정의 분리)

| 종류 | 목적 | “완료” 선언 |
|------|------|-------------|
| **Ops 게이트** | 운영·콘텐츠·관측 등 **스크립트/리포트 증거** | 지정 스크립트 실행·`reports/*.json` 등 **인용 가능한 산출** 없이 PASS 금지. 블록 D·`pnpm run content-ops:*` 류. |
| **제품 BUILD** | 앱/라이브러리/CI 설정 등 **실행 코드·테스트 변경** | §2.6 `pnpm verify`(또는 팀 합의 동등 최소). Ops 증거만으로 대체 불가. |

한 턴에 **둘을 섞어** “출하 완료”처럼 말하지 않는다. 각각 레이블을 붙인다.

**문서·메모리뱅크·스킬 본문만** 다루고 `content-ops:*` 등을 돌리지 않았다면, 그 턴은 **Ops 게이트 PASS가 아니다** — “문서/하네스 유지보수”로만 기록하면 된다(`tasks.md`/`activeContext.md` 한 줄 증거 권장).

### 2.6 제품 BUILD — verify 게이트 (BUILD → REFLECT)

**If** 아래 중 하나라도 해당하면 **then** “BUILD 완료”·REFLECT 시작·PR ready 선언 전에 **`pnpm verify`**를 통과시킨다(또는 팀이 합의한 **동등한 최소** 하위 집합: 예 lint+typecheck+관련 테스트만).

- `src/**`, `tests/**`, `e2e/**`, `scripts/**`에서의 실행 코드·테스트·스냅샷 변경  
- `package.json`, `pnpm-lock.yaml`, `next.config.*`, `vitest.config.*`, `tsconfig*.json`, `eslint.config.*`, CI 워크플로(`.github/**`) 변경  
- **예외:** 순수 문서(`docs/**`만)·메모리뱅크 서술만·`.mdc`/스킬 본문만·이 PR 가이드처럼 런타임에 영향 없는 마크다운만 바뀐 경우 — 팀 합의 시 verify 생략 가능; 요구 시에도 verify 유지.

gstack **`/ship`** 등은 이 저장소의 **`pnpm verify`·훅을 대체하지 않는다.** 커밋 규칙: [`.cursor/rules/commit-verification.mdc`](../.cursor/rules/commit-verification.mdc).

---

## 3. 언제 무엇을 쓰나 (요약)

| 상황 | 권장 |
|------|------|
| 일반 구현·버그 수정 | **§2 세션 하네스** + INIT→ARCHIVE를 복잡도에 맞게 — **무단으로 PLAN/CREATIVE 생략 금지**; 사용자 fast path만 예외. 모드 매핑: **§6**. |
| 아이디어·제품 방향을 압축하고 싶음 | gstack **`/office-hours`** 또는 **`/plan-ceo-review`** → 결과를 North Star·`tasks.md`에 반영 |
| 아키텍처·엣지 케이스 확정 | **`/plan-eng-review`** (또는 Cursor Plan) → ADR·`creative-architecture.md` |
| 랜딩·UI 품질 | **`/plan-design-review`** + 필요 시 `ui-ux-pro-max` 스킬 |
| **UI·제품 피처 — 전체 순서** | **[`docs/design/QUALITY_PIPELINE.md`](design/QUALITY_PIPELINE.md)** |
| PR 전 품질·리그레션 | **`/review`**; 브라우저 검증은 **`/qa`** 또는 **`/browse`** (설치 시) |
| 출하 파이프라인 | **`/ship`** — 단, **§2.6 및 훅** 준수 |

### 3a. Vercel 공식 플러그인 (선택)

Next.js·Vercel 배포·환경 동기화를 에이전트 슬래시로 보강할 때만 쓴다. 레이어 **A–C와 충돌 시 항상 A–C가 우선**이다. 표: [**`AGENTS.md`](../AGENTS.md) § Vercel plugin** · [공식 문서](https://vercel.com/docs/agent-resources/vercel-plugin).

---

## 4. 프롬프트·사용자 메시지 (Tier 확장)

사용자·에이전트가 같은 판단을 하도록 세션 시작 시 **목표 한 줄·범위**를 두고, **Tier 0 → Tier 1** 순으로만 확장한다(§2.1).

- **목표 한 줄**, **영향 받는 파스**(파일/기능 언급)  
- `tasks.md`의 해당 줄·체크박스 또는 `activeContext.md` 다음 앵커 인용(붙여넣기 최소·경로 권장)  
- 우선순위·복붙 세션 템플릿: [**`AI_EXPERT_PROMPTS.md`**](AI_EXPERT_PROMPTS.md)

**결제·외부 API·PII**가 걸리면 채팅 요약만으로 끝내지 말고 **공식 문서 MCP** 등으로 스펙을 확인한다. 관련 PLAN: [`features/PLAN-ai-native-workflow-evolution-2026-05.md`](./features/PLAN-ai-native-workflow-evolution-2026-05.md) §4 P0.

**제안·로드맵 응답 시:** 한 가지 **최선안** 먼저 — [`AI_EXPERT_PROMPTS.md`](AI_EXPERT_PROMPTS.md) §1. 가능하면 **블록 B/C 형태 완성 프롬프트**를 함께 출력.

---

## 5. gstack 설치·목록

- **설치·Bun·충돌 회피**: [`docs/GSTACK.md`](GSTACK.md)  
- **스킬 인벤토리(긴 목록)**: 루트 [`CLAUDE.md`](../CLAUDE.md) 또는 vendored [`.agents/skills/gstack/AGENTS.md`](../.agents/skills/gstack/AGENTS.md)

---

## 6. Cursor 모드·페이즈 ↔ gstack (비파괴)

**라우팅·L1–L4 기본값:** [**`AGENTS.md`](../AGENTS.md) § Operating model**. 아래는 gstack 보강 요약.

| Phase | Cursor (typical) | gstack 보강 (선택, `.agents/skills/gstack` 설치 시) |
|--------|------------------|------------------------------------------------------|
| **INIT** | Ask / Agent — §2.2 출력 | `/office-hours` 등 |
| **PLAN** | **Plan** | `/plan-eng-review`, `/autoplan`, `/plan-ceo-review` |
| **CREATIVE** | **Plan** | `/plan-design-review`, `/plan-ceo-review` |
| **BUILD** | **Agent** | Cursor `implementer` / `frontend-engineer` / `debugger`; `/ship` **§2.6 종속** |
| **REFLECT** | Ask / **Debug** | `/review`, `/qa`·`/qa-only`, `/investigate`, `/retro` |
| **ARCHIVE** | Agent | `/document-release`, `memory-bank/archive/` 규약 |

**측정·개선 루프:** [`AI_AGENT_MATURITY_REPORT.md`](AI_AGENT_MATURITY_REPORT.md) (P1–P5, T1–T2).

---

## 7. 금지·주의

- **환경 변수·키를 프롬프트에 넣지 않는다** — `.env.local`만.  
- **gstack만으로 커밋 훅을 건너뛰지 않는다** — `commit-verification` 규칙 유지.  
- **PostHog·피처 플래그** — `.cursor/rules/posthog-integration.mdc` 준수.

---

## 8. 관련 문서

| 문서 | 용도 |
|------|------|
| [`AI_USAGE.md`](./AI_USAGE.md) | 짧은 진입점 |
| [`MEMORY_BANK_SKILL_GUIDE.md`](./MEMORY_BANK_SKILL_GUIDE.md) | `@elevate-work-harness` 팀 가이드·Skill-first 되돌리기(상세) |
| [`features/PLAN-ai-native-workflow-evolution-2026-05.md`](./features/PLAN-ai-native-workflow-evolution-2026-05.md) | 워크플로 리서치·백로그 |
| [`CURSOR_RULES_AUDIT.md`](./CURSOR_RULES_AUDIT.md) | `.cursor/rules` 스냅샷 |
| [`adr/README.md`](./adr/README.md) | ADR 프로세스 |
| [`features/PLAN-ai-native-workflow-p2-rfc.md`](./features/PLAN-ai-native-workflow-p2-rfc.md) | P2 RFC |
| [`features/PLAN-ai-native-workflow-doc-gate.md`](./features/PLAN-ai-native-workflow-doc-gate.md) | 문서 게이트 |
| [`GSTACK.md`](./GSTACK.md) | vendored gstack 설치 |
| [`DEVELOPMENT.md`](./DEVELOPMENT.md) | 스크립트·CI·env |
| [`design/SYSTEM.md`](./design/SYSTEM.md) | 디자인 토큰 |
| [`memory-bank/README.md`](../memory-bank/README.md) | Memory Bank 파일 역할 |
| [`AI_EXPERT_PROMPTS.md`](AI_EXPERT_PROMPTS.md) | 의사결정 바 + 블록 A~D 원문 |
| [`AI_AGENT_MATURITY_REPORT.md`](AI_AGENT_MATURITY_REPORT.md) | 성숙도 점수 |
| [`design/QUALITY_PIPELINE.md`](design/QUALITY_PIPELINE.md) | 디자인·엔지 리뷰 순서 |
| [`DEV_PROCESS_GITHUB.md`](DEV_PROCESS_GITHUB.md) | GitHub Issues · `pnpm issues:studio` |

---

## 9. 자동화 (버그·기능 요청도 동일 동작)

- **Cursor**: `.cursor/rules/ai-session-bootstrap.mdc` — 구현·버그·기능 시 **Tier 0** 로드 후 **§2** 준수.  
- **명시 세션 (선택):** `.cursor/skills/elevate-work-harness` — 트리아지·INIT·블록 A 동등 의무·gstack 브릿지; 별칭 `elevate-memory-bank-bootstrap` / `elevate-expert-session-block`. 가이드: [`MEMORY_BANK_SKILL_GUIDE.md`](./MEMORY_BANK_SKILL_GUIDE.md).  
- **Skill-first `[x]` 되돌리기:** 절차 전부 [`MEMORY_BANK_SKILL_GUIDE.md`](./MEMORY_BANK_SKILL_GUIDE.md) 해당 절 — **본 문서에서는 이 한 줄만** 링크한다.  
- **사용자 템플릿:** [`AI_USER_TEMPLATES.md`](./AI_USER_TEMPLATES.md).

---

## 10. 다른 프로젝트로 복제

최소 변경: [`docs/AI_WORKFLOW_PORTABILITY.md`](AI_WORKFLOW_PORTABILITY.md) Tier B 체크리스트.

---

## REFLECT — 하네스 리빌드 (문서·스킬)

- **무엇을 했나:** §2 에 **Tier 0/1**, **INIT 단일 블록**, **턴 종료**, **Ops vs 제품 BUILD**, **verify §2.6** 을 한 곳으로 모았다. 교차 참조 번호 정리로 `§2b` 등 레거시 점 검색 시 **§2.6** 과 본 허브를 따르라.  
- **의도적 중복 허용:** [`AGENTS.md`](../AGENTS.md) 에 **Operating model 원칙 + Vercel 표** 등 “제품 헌장” 성격 유지 — 하네스 **형식·게이트**는 본 문서 우선.

### 다음 세션 블록 B (복붙)

```text
[역할·로드] docs/AI_EXPERT_PROMPTS.md §2 블록 A 전문을 그대로 적용한다.

[요청]
docs/AI_ORCHESTRATION.md §2 와 다른 문서/규칙/스킬 간 링크를 점검한다: §8→관련 문서, §9→자동화, §2.6→verify 언급이 남은 파일을 고쳐라. 새 SoT 파일은 만들지 않는다.

[완료 조건]
- [ ] rg "§2b" 또는 구 verify 절번호 잔존 시 갱신
- [ ] memory-bank/tasks.md 또는 activeContext.md에 교차 검수 한 줄(선택)
- [ ] 문서만이면 verify 생략 합의 한 줄 명시
```
