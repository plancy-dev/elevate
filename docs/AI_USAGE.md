# AI / Cursor — Elevate 진입점

**전체 구조(레이어·의사결정·프롬프트 계약)는 [`docs/AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md)를 본다.**  
이 파일은 빠른 링크만 유지한다.

## 30초 체크리스트

1. **`memory-bank/tasks.md`** — 지금 해야 할 일 (SoT)  
2. **`memory-bank/activeContext.md`** — 단계·앵커 파일  
3. **`AGENTS.md` / `CLAUDE.md`** — Next.js 16 · gstack 요약  
4. **구현·스크립트** — [`DEVELOPMENT.md`](./DEVELOPMENT.md)  
5. **디자인 토큰·표면** — [`docs/design/SYSTEM.md`](./design/SYSTEM.md)  
6. **PostHog 퍼널 (UI에서 구성)** — [`POSTHOG_FUNNELS.md`](./POSTHOG_FUNNELS.md)  
7. **원격 이슈·PR 큐** — [`DEV_PROCESS_GITHUB.md`](./DEV_PROCESS_GITHUB.md) · `pnpm issues:studio`
8. **Slack 없는 운영 자동화** — [`AUTOMATIONS_NO_SLACK_OPS.md`](./AUTOMATIONS_NO_SLACK_OPS.md)
9. **전문가 의사결정·복붙 프롬프트** — [`AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md)  
10. **업계 대비 워크플로 PLAN (2026-05)** — [`features/PLAN-ai-native-workflow-evolution-2026-05.md`](./features/PLAN-ai-native-workflow-evolution-2026-05.md)  
11. **Cursor 규칙 감사 (P1)** — [`CURSOR_RULES_AUDIT.md`](./CURSOR_RULES_AUDIT.md) · verify 게이트 [`AI_ORCHESTRATION.md`](./AI_ORCHESTRATION.md) §2b

**자동**: 구현·버그·기능 요청은 `.cursor/rules/ai-session-bootstrap.mdc`가 위 컨텍스트를 로드한다.  
**권장 입력 형식**: [`AI_USER_TEMPLATES.md`](./AI_USER_TEMPLATES.md) · **전문가 세션**: [`AI_EXPERT_PROMPTS.md`](./AI_EXPERT_PROMPTS.md) · **타 프로젝트 이식**: [`AI_WORKFLOW_PORTABILITY.md`](./AI_WORKFLOW_PORTABILITY.md).

## 폴더

| 경로 | 용도 |
|------|------|
| `.cursor/rules/` | INIT→BUILD 워크플로, 커밋, Memory Bank 가이드 |
| `.cursor/skills/` | React/UI 보조 (선택) |
| `.agents/skills/gstack/` | gstack vendored 스킬 — [GSTACK.md](./GSTACK.md) |

## MCP

Supabase·Stitch·Toss·**PostHog** 등은 **`.cursor/mcp.json`** — 토큰·키는 저장소에 넣지 않는다. PostHog는 [공식 MCP 문서](https://posthog.com/docs/model-context-protocol/cursor) 참고; 예시는 `mcp.json.example`의 `posthog` 항목.

## 서브에이전트

`.cursor/agents/` — 대규모 변경 시 `workflow-modes.mdc` 참고.
