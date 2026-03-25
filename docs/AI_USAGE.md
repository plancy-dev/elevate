# AI / Cursor 사용 가이드 — Elevate

이 저장소에서 AI 코딩 도우미를 쓸 때의 **진입점**과 **문서 위치**만 정리한다.

## 1. 무엇을 먼저 읽나

1. **`memory-bank/tasks.md`** — 페이즈·우선순위 (단일 소스)
2. **`memory-bank/activeContext.md`** — 지금 단계·다음 앵커 파일
3. **`docs/DEVELOPMENT.md`** — 로컬 개발·CI·스크립트
4. **`AGENTS.md` / `CLAUDE.md`** — Next.js 16 주의사항

## 2. `.cursor` 구조

| 경로 | 용도 |
|------|------|
| `rules/workflow-modes.mdc` | INIT→PLAN→BUILD… 워크플로우 |
| `rules/memory-bank-guide.mdc` | memory-bank 갱신 트리거 |
| `rules/cursor-ai-context.mdc` | 규칙 인덱스 (본 문서와 연결) |
| `skills/` | UI/React 보조 스킬 (선택) |

**참고**: `rust-*` 규칙은 **이 프로젝트에서 사용하지 않음** (Next.js + TS 전용).

## 3. Memory Bank

- 인덱스: **`memory-bank/README.md`**
- 아카이브: `memory-bank/archive/` (선택)

## 4. MCP

- Supabase MCP, Stitch, Toss 등은 **`.cursor/mcp.json`** — **토큰·API 키는 저장소에 넣지 말 것**. 로컬·Cursor 설정에만 둔다.

## 5. 서브에이전트

`.cursor/agents/` — 탐색·프론트·디버거 등; 대규모 작업 시 `workflow-modes.mdc` 참고.
