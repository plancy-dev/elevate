---
name: elevate-memory-bank-bootstrap
description: >-
  Starts an Elevate work session with Memory Bank INIT (tasks/activeContext,
  L1–L4 path) plus AI-native hygiene: path-first context, no secret paste,
  pnpm verify as harness. Use when the user begins substantive work, says
  "MB 시작", "메모리뱅크 세션", "INIT 부트스트랩", "새 작업 스킬", "@elevate-memory-bank-bootstrap",
  or wants Agentic Engineering without typing "INIT 모드에서…".
disable-model-invocation: true
---

# Elevate — Memory Bank session bootstrap

이 스킬은 **명시적으로 불렸을 때만** 로드된다. 호출되면 아래 순서를 **한 번에** 수행한다.

## 0. 단일 소스 (복붙 금지)

- 페이즈·모드 매핑: **`.cursor/rules/workflow-modes.mdc`** (이미 always-on이면 중복 설명하지 말 것)
- 레이어 A→B→C: **`docs/AI_ORCHESTRATION.md`**
- 운영 모델·L1–L4 체인: **`AGENTS.md`** § AI orchestration → Operating model

이 스킬은 **절차와 출력 형식**만 고정한다. 표·체크리스트의 긴 본문은 위 파일을 읽는다.

---

## 1. 즉시 읽기 (도구)

순서 고정:

1. **`memory-bank/tasks.md`**
2. **`memory-bank/activeContext.md`**
3. (사용자가 새 기능·제품 방향을 언급하면) **`memory-bank/creative-elevate-ai-pivot.md`** 한 단락만
4. (MICE·레거시 용어가 보이면) **`memory-bank/domainKnowledge.md`** 필요 부분만

없으면 사용자에게 경로·초기화 여부를 확인한다.

---

## 2. INIT (VAN) 수행

`workflow-modes.mdc`의 INIT 체크리스트를 따른다. 관련 코드 탐색이 필요하면 **`explorer`** Task 또는 제한된 검색으로 범위를 좁힌다.

**복잡도 L1–L4**를 선언하고, 그에 맞는 **다음 페이즈**를 한 줄로 고른다 (표는 `workflow-modes.mdc` 참조).

---

## 3. 영상·업계 패턴 → 이 저장소 관행 (요약)

| 개념 (참고 영상) | 이 레포에서의 하네스 |
|------------------|----------------------|
| **AI-ready codebase** | `AGENTS.md`, `CLAUDE.md`, `.cursor/rules/*`, `DESIGN.md` / ADR — 에이전트가 **경로로 읽게** 안내 |
| **Context bloat / 거대 출력** | 로그·JSON **전부 붙여넣기 금지**; 파일 경로 + 필요 시 `offset`/`limit`로 읽기. `docs/AI_ORCHESTRATION.md` §3 프롬프트 계약 |
| **캐시·반복 비용** | 동일 턴에서 이미 읽은 `tasks.md`/`activeContext.md`는 **재읽기 생략** (`ai-session-bootstrap.mdc`와 동일 원칙) |
| **Safeguard / Hooks** | Husky·lint-staged, `commit-verification`, **`pnpm verify`**, CI — gstack `/ship`이 **이걸 대체하지 않음** (`AI_ORCHESTRATION.md` §6) |
| **Agentic Engineering** | INIT→ARCHIVE 체인 + (선택) gstack **1~2개만** (`AGENTS.md` 표). 병렬·전문 분리는 Cursor **Task** 서브에이전트 (`workflow-modes.mdc` §서브에이전트) |

외부 레퍼런스(팀 학습용): [5x 산출량·4단계·컨텍스트/훅](https://www.youtube.com/watch?v=ahGgv9lsWlU), [Codex 앱·스킬·MCP·워크트리](https://www.youtube.com/watch?v=ZkD6nE3JopY). 상세 매핑은 [`docs/MEMORY_BANK_SKILL_GUIDE.md`](../../../docs/MEMORY_BANK_SKILL_GUIDE.md).

---

## 4. 사용자에게 출력 (고정 형식)

`workflow-modes.mdc`의 **INIT 출력 형식**을 **그대로** 채워 출력한다:

```
✅ INIT 완료
━━━━━━━━━━━━━━━━━━
📁 파일: [n개 또는 탐색 범위]
📊 복잡도: L[1-4]
   - 파일 수: n / 설계: 필요·불필요 / DB: 있음·없음
➡️ 다음: [PLAN 또는 BUILD 등]
```

그 아래에 **한 줄 권장**:

- 다음 Cursor 모드 (Ask / **Plan** / **Agent** / Debug) — `workflow-modes.mdc` 표에 맞게
- gstack을 쓸 경우 **최대 1~2개**만 제안 (이미 Memory Bank 로드 후)

---

## 5. 턴 종료 시 (구현·게이트·memory-bank·GitHub 증거가 있으면)

`docs/AI_EXPERT_PROMPTS.md` **블록 A** 전문 + 상황에 맞는 **B/C/D**를 문서에서 **그대로** 출력한다 (`AGENTS.md` Session handoff와 동일).

---

## 6. 사람용 안내

팀 온보딩·호출 방법: **`docs/MEMORY_BANK_SKILL_GUIDE.md`**
