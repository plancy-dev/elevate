# Memory Bank 부트스트랩 스킬 — 팀 가이드

Elevate에서는 **같은 모델**을 써도 산출이 갈리는 이유를 **컨텍스트·세이프가드·하네스**로 줄이기 위해, Memory Bank와 Cursor 규칙을 표준으로 쌓아 두었다.  
여기서는 **“INIT 모드에서 ~~해줘” 한 줄 프롬프트 대신**, 프로젝트 스킬 **`elevate-memory-bank-bootstrap`**으로 세션을 여는 방법을 정리한다.

## 무엇이 바뀌나

| 이전 습관 | 권장 |
|-----------|------|
| 매번 “INIT 모드에서 tasks 읽고…” 길게 적기 | 채팅에서 스킬을 **지명**해 한 번에 부트스트랩 |
| 로그·환경값 통째로 붙여넣기 | **파일 경로**와 짧은 목표만 주고, 에이전트가 도구로 읽기 |
| PLAN 없이 큰 기능 바로 구현 | `AGENTS.md` **L2+** 에서는 PLAN 생략 금지 (사용자 fast path 명시 시만 예외) |

**자동 부트스트랩** (`.cursor/rules/ai-session-bootstrap.mdc`)은 구현·버그·기능 요청 시에도 `tasks` / `activeContext`를 읽는다. **이 스킬**은 그 위에 **INIT 산출물 형식·복잡도·다음 모드·영상에서 말하는 비용/훅 습관**을 한 블록으로 고정한다.

## 스킬 호출 방법 (Cursor)

1. 채팅 입력창에서 **Skills / @** 로 프로젝트 스킬 목록을 연다.  
2. **`elevate-memory-bank-bootstrap`** (또는 표시 이름이 같으면 그걸) 선택한다.  
3. 같은 메시지에 **목표 한 줄** + (있다면) **이슈 번호·브랜치·범위**만 덧붙인다.

트리거 예시 (에이전트가 스킬을 고르기 쉬운 문구):

- “`elevate-memory-bank-bootstrap` 켜고 오늘 할 일 시작”
- “MB 시작 — #62 사이드바만”
- “메모리뱅크 세션 부트스트랩 후 PLAN까지”

스킬 메타데이터에 `disable-model-invocation: true`가 있어 **이름을 부르지 않으면** 자동으로 끼워 넣지 않는다. **의도적으로 켤 때** 쓰는 하네스다.

## 에이전트가 하는 일 (요약)

1. `memory-bank/tasks.md` → `activeContext.md` 순으로 읽는다.  
2. INIT(VAN): 범위·파일 수·설계·DB 여부로 **L1–L4**를 선언한다.  
3. `workflow-modes.mdc`에 있는 **INIT 완료** 블록 형식으로 답한다.  
4. **다음 단계** (PLAN / BUILD 등)와 권장 Cursor 모드를 한 줄 제안한다.  
5. 작업이 끝난 턴에는 `docs/AI_EXPERT_PROMPTS.md` **블록 A + B/C/D**를 규칙대로 붙인다.

## 긴 디버그·세션 리셋

같은 채팅 스레드에서 **디버그·재시도·부분 수정**이 길어지면, 이전 턴의 가설·거절된 패치·중복 로그가 컨텍스트에 남아 **판단이 흔들리기 쉽다**. 커뮤니티에서는 **사용자 메시지 기준 약 20턴**을 넘기면 새 스레드를 여는 것을 권장하는 경우가 많다([cursor-ai-tips](https://github.com/murataslan1/cursor-ai-tips) 등 큐레이션).

**권장 절차:** (1) **새 채팅**을 연다. (2) `memory-bank/tasks.md`와 `activeContext.md`에서 **지금 목표·범위·다음 앵커만** 짧게 인용한다(전체 파일 붙여넣기 금지). (3) 맨 위에 [`docs/AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md) **블록 A**를 다시 넣어 역할·필수 읽기 파일을 고정한다. (4) 남은 작업은 **블록 B** 형태로 이어간다.

이 패턴은 장기 에이전트 하네스에서 말하는 **세션 간 깨끗한 handoff·증분 진행**과 같은 축이다([Anthropic — Effective harnesses for long-running agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)).

이 웨이브의 문서 SoT: [`docs/features/PLAN-ai-native-workflow-evolution-2026-05.md`](./features/PLAN-ai-native-workflow-evolution-2026-05.md) §4 P0.

## 영상에서 말하는 것과의 연결 (학습 맥락)

- **4단계 (AI-Aware → AI-Native)** — 우리 쪽에서는 “규칙·Memory Bank·verify를 **매번** 쓰는가”로 대응한다.  
- **비용 패턴 (컨텍스트 비대, 거대 툴 출력 등)** — `docs/AI_ORCHESTRATION.md` §3: **경로로 읽기**, 불필요한 전문 붙여넣기 금지.  
- **Hooks / 사고 예방** — 저장소 훅 + CI + **`pnpm verify`**; 키는 채팅에 넣지 않는다 (`AI_ORCHESTRATION.md` §6).  
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
| [`.cursor/rules/workflow-modes.mdc`](../.cursor/rules/workflow-modes.mdc) | INIT 출력 형식·모드 전환 |
| [`.cursor/skills/elevate-memory-bank-bootstrap/SKILL.md`](../.cursor/skills/elevate-memory-bank-bootstrap/SKILL.md) | 스킬 본문 (에이전트용) |

## 유지보수

- **워크플로 표나 INIT 형식을 바꿀 때**는 `workflow-modes.mdc` / `AGENTS.md`를 먼저 고치고, 스킬은 **중복 서술을 늘리지 말고** 링크만 맞춘다.  
- 스킬의 `description`에 **트리거 문구**를 넣어 두면 Cursor가 스킬 선택을 잘한다.
