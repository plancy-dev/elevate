# Memory Bank 부트스트랩 스킬 — 팀 가이드

Elevate에서는 **같은 모델**을 써도 산출이 갈리는 이유를 **컨텍스트·세이프가드·하네스**로 줄이기 위해, Memory Bank와 Cursor 규칙을 표준으로 쌓아 두었다.  
**권장 진입점(통합):** **`@elevate-work-harness`** — 트리아지(지금 할 일 vs 새 요청)·INIT·전문가(블록 A)·토큰 규율·**gstack 브릿지(벤더 분리)** 를 한 스킬에 모았다.  
호환: **`@elevate-memory-bank-bootstrap`** / **`@elevate-expert-session-block`** 은 동일 하네스의 **별칭**(INIT 초점 vs 전문가 모드 초점).

## 무엇이 바뀌나

| 이전 습관 | 권장 |
|-----------|------|
| 매번 “INIT 모드에서 tasks 읽고…” 길게 적기 | **`@elevate-work-harness`** (또는 별칭)로 **한 번에** 부트스트랩·트리아지 |
| 로그·환경값 통째로 붙여넣기 | **파일 경로**와 짧은 목표만 주고, 에이전트가 도구로 읽기 |
| PLAN 없이 큰 기능 바로 구현 | `AGENTS.md` **L2+** 에서는 PLAN 생략 금지 (사용자 fast path 명시 시만 예외) |

**자동 부트스트랩** (`.cursor/rules/ai-session-bootstrap.mdc`)은 구현·버그·기능 요청 시에도 `tasks` / `activeContext`를 읽는다. **통합 하네스 스킬**은 그 위에 **INIT 산출물 형식·복잡도·다음 모드·트리아지·영상에서 말하는 비용/훅 습관**을 한 블록으로 고정한다.

## 스킬 호출 방법 (Cursor)

1. 채팅 입력창에서 **Skills / @** 로 프로젝트 스킬 목록을 연다.  
2. **권장:** **`elevate-work-harness`** — 트리아지 + INIT + 전문가 연속 + gstack 브릿지(벤더는 `.agents/skills/gstack` 에 유지).  
3. **호환 별칭:** `elevate-memory-bank-bootstrap`(INIT 초점), `elevate-expert-session-block`(블록 A·`[요청]` 초점).  
4. 같은 메시지에 **목표 한 줄** + (있다면) **이슈 번호·브랜치·범위**만 덧붙인다.

트리거 예시 (에이전트가 스킬을 고르기 쉬운 문구):

- “`@elevate-work-harness` 켜고 오늘 할 일 시작”
- “MB 시작 — #62 사이드바만”
- “메모리뱅크 세션 부트스트랩 후 PLAN까지”

스킬 메타데이터에 `disable-model-invocation: true`가 있어 **이름을 부르지 않으면** 자동으로 끼워 넣지 않는다. **의도적으로 켤 때** 쓰는 하네스다.

## 팀 온보딩 한 줄 (초안)

Slack 등에 그대로 붙여 넣을 **한 줄** 초안이다. (톤만 조정하면 됨.)

- **한국어:** 새 Cursor 채팅은 **`@elevate-work-harness`** 한 줄 + **목표 한 줄**로 연다 — 상세·별칭·Skill-first 게이트는 **`docs/MEMORY_BANK_SKILL_GUIDE.md`**.
- **English:** Start each Cursor chat with **`@elevate-work-harness`** plus a **one-line goal** — full guide: **`docs/MEMORY_BANK_SKILL_GUIDE.md`**.
- **README 한 줄(표 밖 요약):** Cursor 세션 시작: **`@elevate-work-harness`** + 목표 한 줄 → [`MEMORY_BANK_SKILL_GUIDE.md`](./MEMORY_BANK_SKILL_GUIDE.md).

### Skill-first `[x]` 가 실제 합의와 다를 때 (되돌리기)

`memory-bank/tasks.md`의 Skill-first INIT 항목이 **`[x]`**인데, 팀이 세션 시작을 `@elevate-work-harness`(또는 INIT 별칭) **기본으로 채택하지 않았다**고 확인되면(가정 반영 오류·Hooks만으로 올린 오해 등), **한 PR**으로 `tasks.md`에서 해당 체크를 **`[ ]`로 되돌리고**, `memory-bank/activeContext.md`에 Skill-first를 **`[x]`로 단정한 문장이 있으면** 미채택·재협의로 고치며, `tasks.md` **Explicit PENDING** 표에 `Skill-first INIT 게이트` 행을 다시 넣는다(재개 조건: 팀 합의·Hooks 등 기존 PLAN § Skill-first와 동일). 슬랙 또는 GitHub 이슈/PR 본문에 **「Skill-first SoT 되돌림 + 이유 한 줄」**을 남겨 되돌림·근거를 추적 가능하게 한다.

- **역링크 (본문 중복 최소):** 레이어·자동화 짧은 안내만 필요하면 [`AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) **§9**만 본다 — Skill-first 되돌리기 **상세 단계**는 이 절의 위 단락이 SoT다.

## 에이전트가 하는 일 (요약)

1. `memory-bank/tasks.md` → `activeContext.md` 순으로 읽는다.  
2. INIT(VAN): 범위·파일 수·설계·DB 여부로 **L1–L4**를 선언한다.  
3. [`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) **§2.2** INIT 완료 블록으로 답한다.  
4. **다음 단계** (PLAN / BUILD 등)와 권장 Cursor 모드를 한 줄 제안한다.  
5. 작업이 끝난 턴에는 `docs/AI_EXPERT_PROMPTS.md` **블록 A + B/C/D**를 규칙대로 붙인다.

## 긴 디버그·세션 리셋

같은 채팅 스레드에서 **디버그·재시도·부분 수정**이 길어지면, 이전 턴의 가설·거절된 패치·중복 로그가 컨텍스트에 남아 **판단이 흔들리기 쉽다**. 커뮤니티에서는 **사용자 메시지 기준 약 20턴**을 넘기면 새 스레드를 여는 것을 권장하는 경우가 많다([cursor-ai-tips](https://github.com/murataslan1/cursor-ai-tips) 등 큐레이션).

**권장 절차:** (1) **새 채팅**을 연다. (2) `memory-bank/tasks.md`와 `activeContext.md`에서 **지금 목표·범위·다음 앵커만** 짧게 인용한다(전체 파일 붙여넣기 금지). (3) 맨 위에 [`docs/AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md) **블록 A**를 다시 넣거나, **`@elevate-work-harness`** / **`@elevate-expert-session-block`** 으로 동등 의무를 건다. (4) 남은 작업은 **블록 B** 형태로 이어간다.

이 패턴은 장기 에이전트 하네스에서 말하는 **세션 간 깨끗한 handoff·증분 진행**과 같은 축이다([Anthropic — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)).

이 웨이브의 문서 SoT: [`docs/features/PLAN-ai-native-workflow-evolution-2026-05.md`](./features/PLAN-ai-native-workflow-evolution-2026-05.md) §4 P0.

## 영상에서 말하는 것과의 연결 (학습 맥락)

- **4단계 (AI-Aware → AI-Native)** — 우리 쪽에서는 “규칙·Memory Bank·verify를 **매번** 쓰는가”로 대응한다.  
- **비용 패턴 (컨텍스트 비대, 거대 툴 출력 등)** — `docs/AI_ORCHESTRATION.md` §4·§2.1 Tier: **경로로 읽기**, 불필요한 전문 붙여넣기 금지.  
- **Hooks / 사고 예방** — 저장소 훅 + CI + **`pnpm verify`**; 키는 채팅에 넣지 않는다 (`AI_ORCHESTRATION.md` §7).  
- **Codex 앱의 스킬·MCP·병렬** — Elevate는 **Cursor 스킬** + **MCP** + **Task 서브에이전트** + (선택) **gstack**으로 같은 축을 담는다.

참고 링크 (팀 공유용):

- [같은 Claude인데 5배 산출량 — 4단계·컨텍스트·훅](https://www.youtube.com/watch?v=ahGgv9lsWlU)  
- [Codex 앱 입문 — 스킬·MCP·워크트리·관제탑](https://www.youtube.com/watch?v=ZkD6nE3JopY)

## 관련 문서

| 문서 | 용도 |
|------|------|
| [`AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) | 레이어·프롬프트 계약·금지 사항 |
| [`AI_USAGE.md`](./AI_USAGE.md) | 30초 체크리스트 |
| [`AGENTS.md`](../AGENTS.md) | Operating model · L1–L4 · gstack 규칙 · **§ Vercel plugin** (배포 슬래시 관행) |
| [`.cursor/rules/workflow-modes.mdc`](../.cursor/rules/workflow-modes.mdc) | Cursor 모드·서브에이전트(INIT 블록은 `AI_ORCHESTRATION.md` §2.2 로 링크) |
| [`.cursor/skills/elevate-work-harness/SKILL.md`](../.cursor/skills/elevate-work-harness/SKILL.md) | **통합 하네스**(트리아지·INIT·전문가·gstack 브릿지) |
| [`.cursor/skills/elevate-memory-bank-bootstrap/SKILL.md`](../.cursor/skills/elevate-memory-bank-bootstrap/SKILL.md) | INIT 별칭 → 위 통합 스킬 |
| [`.cursor/skills/elevate-expert-session-block/SKILL.md`](../.cursor/skills/elevate-expert-session-block/SKILL.md) | 전문가 별칭 → 위 통합 스킬 |

## 유지보수

- **워크플로 표나 INIT 형식을 바꿀 때**는 [`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) **§2** 를 먼저 고친 뒤 `workflow-modes.mdc`·`AGENTS.md`·스킬 링크를 맞춘다 (**중복 서술 금지**).  
- 스킬의 `description`에 **트리거 문구**를 넣어 두면 Cursor가 스킬 선택을 잘한다.
