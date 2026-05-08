---
name: elevate-work-harness
description: >-
  Single Elevate session harness: triage backlog vs new request, token-aware load
  order (tasks → activeContext → AI_ORCHESTRATION), INIT/Expert modes, optional
  gstack bridge (do not fork vendor). Use @elevate-work-harness for new sessions,
  "무엇부터 할지", MB/INIT, expert Block A without pasting, or when combining
  repo work with gstack slash skills.
disable-model-invocation: true
---

# Elevate — Work harness (통합 세션·트리아지·gstack 브릿지)

이 스킬은 **저장소 안에서의 의사결정·컨텍스트·검증 하네스**를 한 곳에 모은다.  
**`.agents/skills/gstack`** 은 **업스트림 벤더 서브트리**이므로 이 폴더에 **물리 병합하지 않는다**. 대신 **§7 gstack 브릿지**로 “언제 어떤 슬래시를 1~2개만 쓸지”만 고정한다.

## §0 왜 예전에 스킬이 둘로 나뉘어 있었나 (지금은 어떻게 쓰나)

| 과거 스킬 | 역할 | 지금 |
|-----------|------|------|
| `elevate-memory-bank-bootstrap` | INIT(VAN) 출력·L1–L4·다음 모드 | **§3 INIT 모드** — 호환용으로 `@elevate-memory-bank-bootstrap` 은 여전히 가능 |
| `elevate-expert-session-block` | 블록 A를 채팅에 안 붙이기 | **§4 전문가 연속 모드** — `@elevate-expert-session-block` 동일 |

**권장:** 새 세션이면 **`@elevate-work-harness`** 한 번만. 구체 요청이 있으면 같은 메시지에 `[요청]` / `[완료 조건]` 을 붙인다.

---

## §1 즉시 읽기 (도구, 순서 고정 · 동일 턴 중복 생략)

이미 이 스레드에서 읽었다면 **재읽기 생략** (`.cursor/rules/ai-session-bootstrap.mdc` 와 동일). **Tier 정의는 [`docs/AI_ORCHESTRATION.md`](../../../docs/AI_ORCHESTRATION.md) §2.1만 canonical**; 여기서는 실행 순서만 둔다.

1. **Tier 0:** `tasks.md` → `activeContext.md` → `docs/AI_ORCHESTRATION.md`(§2 포함)  
2. **Tier 1:** 질문·범위가 §2.1 표의 조건을 치면 그때만 추가 파일

경로 문제가 있으면 사용자에게 확인한다.

## §2 트리아지 — “지금 무엇을 할지” (토큰·업무 판단)

사용자 메시지를 아래 **한 가지**로 분류하고, **추천은 하나만** 낸다 (의사결정 바: `docs/AI_EXPERT_PROMPTS.md` §1).

| 신호 | 판단 | 에이전트 동작 |
|------|------|----------------|
| 목표가 비었거나 “뭐부터?” 만 있음 | **백로그 정렬** | `tasks.md`·`activeContext.md` 기준 **다음 한 작업** + 이유 2~3줄. **코드 변경 없음**이 기본. |
| 설명·개념 질문만 (“어떻게 동작?”) | **읽기 전용** | 관련 파일만 읽고 답한다. `pnpm verify` 는 변경이 없으면 생략. |
| 구현/버그/기능 + 범위가 명확 + L1 또는 사용자가 fast path 명시 | **즉시 BUILD** | §4 의무(블록 A) 충족 후 구현. 제품 BUILD면 verify — [`AI_ORCHESTRATION.md`](../../../docs/AI_ORCHESTRATION.md) §2.6. |
| 범가지·다중 설계·5+ 파일 예상 (L2+) | **PLAN 선행** | Cursor **Plan** 모드 권장. PLAN 없이 큰 diff 금지 (`AGENTS.md` 운영 모델). |
| 사용자가 **`@…스킬`** 과 **새 작업**을 같이 줌 | **트리아지 우선** | 스킬만으로 “바로 실행”이 자동이 아님. §2 표로 **지금이 BUILD인지 PLAN인지** 먼저 선언한 뒤, 해당 모드로 진행. |
| `memory-bank` 와 요청이 충돌 | **SoT 정합** | 코드보다 먼저 `tasks.md` / `activeContext.md` 수정안 또는 사용자 확인. |

**gstack:** 트리아지 결과가 “리뷰·전략·QA만”이면 §7에서 **슬래시 1~2개**만 고른다. 구현 검증은 **`pnpm verify`** 가 우선이다.

---

## §3 INIT 모드 (VAN — 예: `@elevate-memory-bank-bootstrap` 과 동일)

1. §1 읽기 완료.
2. INIT 체크리스트·복잡도 L1–L4: [`docs/AI_ORCHESTRATION.md`](../../../docs/AI_ORCHESTRATION.md) **§2.2–§2.3** .
3. **다음 페이즈** 한 줄 (PLAN / BUILD / …).
4. 출력 형식 **[`docs/AI_ORCHESTRATION.md`](../../../docs/AI_ORCHESTRATION.md) §2.2** 블록으로만 작성:

```
✅ INIT 완료
━━━━━━━━━━━━━━━━━━
📁 파일: [n개 또는 탐색 범위]
📊 복잡도: L[1-4]
   - 파일 수: n / 설계: 필요·불필요 / DB: 있음·없음
➡️ 다음: [PLAN 또는 BUILD 등]
```

5. 그 아래 **한 줄**: 권장 Cursor 모드 + (선택) gstack 최대 1~2개 — `AGENTS.md` 표 준수.

---

## §4 전문가 연속 모드 (블록 A 동등 — 예: `@elevate-expert-session-block`)

채팅에 블록 A 전문을 붙이지 않아도, 아래 의무는 **블록 A와 동일** (`docs/AI_EXPERT_PROMPTS.md` §2).

```text
역할: 너는 15년 이상 레거시·운영·제품을 겪어 본 스태프/프린시플 엔지니어다. 추천은 하나만 내고, 트레이드오프는 짧게, 근거는 파일 경로로 제시해라.

필수 (도구로 읽기):
1. memory-bank/tasks.md
2. memory-bank/activeContext.md
3. docs/AI_ORCHESTRATION.md

그 다음 사용자 요청을 수행한다. 메모리뱅크와 모순되면 구현 전에 어떤 파일을 어떻게 고칠지 제안해라.
검증: 제품 BUILD 변경이면 변경 후 pnpm verify(또는 합의된 최소 검증). 순수 문서·`.mdc`·스킬만이면 `docs/AI_ORCHESTRATION.md` §2.6 예외에 따름.
```

SoT 편집: 스킬과 문서가 어긋나면 **`docs/AI_EXPERT_PROMPTS.md`** 를 먼저 맞춘 뒤 이 스킬을 동기화한다.

**사용자 최소 입력 예:**

```text
@elevate-work-harness

[요청]
…

[완료 조건]
…
```

---

## §5 토큰·컨텍스트 규율 (하네스 성능)

- 로그·JSON·환경값 **통째 붙여넣기 금지** — 파일 경로 + `offset`/`limit` 로 읽기 (`AI_ORCHESTRATION.md` §4·§2.1 Tier 규율).
- 동일 파일 **같은 턴 재읽기 생략**.
- 대규모 탐색은 **Task `explorer`** 또는 좁은 `grep`/`semantic` — 무작위 전역 나열 금지.
- **비밀**은 채팅·PR에 넣지 않는다.

---

## §6 턴 종료 (구현·게이트·memory-bank·GitHub 증거가 있으면)

`AGENTS.md` Session handoff: [`docs/AI_EXPERT_PROMPTS.md`](../../../docs/AI_EXPERT_PROMPTS.md)에서 **블록 A** 전문 + 상황에 맞는 **B/C/D** 전문을 **그대로** 출력한다. 규약·예외 요약은 [`docs/AI_ORCHESTRATION.md`](../../../docs/AI_ORCHESTRATION.md) **§2.4**(사소한 Q&A는 생략 가능).

---

## §7 gstack 브릿지 (통합이 아니라 **경계**)

| 원칙 | 설명 |
|------|------|
| **벤더 분리** | gstack은 `.agents/skills/gstack` 에 두고 **업데이트는 upstream** (`docs/GSTACK.md`). Cursor 스킬에 gstack 본문을 복제하지 않는다. |
| **저장소 우선** | `AGENTS.md`, `.cursor/rules`, Husky, **`pnpm verify`** 는 gstack이 **대체 불가**. |
| **스파스 사용** | Memory Bank 로드 후 **슬래시 1~2개만** (`AGENTS.md` 운영 모델 표). |

**슬래시 전체 인벤토리(단일 소스):** [`CLAUDE.md`](../../../CLAUDE.md) § **gstack** — *Skill inventory* 줄만 따른다(이 스킬에 목록을 복제하지 않는다).

**페이즈 → (선택) gstack 힌트** — 상세 표는 **`AGENTS.md`** § AI orchestration → Operating model. 여기서는 예시만:

- INIT / 아이디어 정렬 → `/office-hours` (선택)
- PLAN 잠금 → `/plan-eng-review` (선택)
- REFLECT → `/review` 또는 `/qa` (설치·환경 있을 때)

설치 없으면 gstack 언급 없이 Cursor·verify만으로 진행한다.

---

## §8 호환 별칭

- `@elevate-memory-bank-bootstrap` → **§3 INIT** 강제 + 나머지는 §2에 맞게.
- `@elevate-expert-session-block` → **§4** 강제.

새 대화의 기본 진입점은 **`@elevate-work-harness`** 권장.
