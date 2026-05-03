# `.cursor/rules` 감사 표 (baseline)

**목적:** [PLAN §4 P1 — AI-native workflow](features/PLAN-ai-native-workflow-evolution-2026-05.md) 항목 1. 토큰·중복 로드를 줄이기 위한 **스냅샷**. 분할·축소는 팀 판단 후 후속 PR로 진행한다.

**갱신 방법:** 아래 표의 줄 수는 `wc -l .cursor/rules/*`로 재생성할 수 있다. `alwaysApply` / `globs`는 각 파일 YAML **첫 블록** 기준.

## 규칙 파일 개요

| 파일 | 줄 수 | alwaysApply | globs (요약) | 비고 |
|------|------:|---------------|--------------|------|
| [commit-verification.mdc](../.cursor/rules/commit-verification.mdc) | 12 | true | (비어 있음) | 커밋 게이트 — 유지 |
| [posthog-integration.mdc](../.cursor/rules/posthog-integration.mdc) | 29 | true | (키만 있고 패턴 없음) | YAML `globs:` 값 없음 — 필요 시 `[]` 명시 권장 |
| [completion-and-commit.mdc](../.cursor/rules/completion-and-commit.mdc) | 32 | false | (키만 있고 값 없음) | Agent-requested 성격 — YAML 정리 후보 |
| [ai-session-bootstrap.mdc](../.cursor/rules/ai-session-bootstrap.mdc) | 43 | true | `[]` | 매 세션 부트스트랩 — 유지 |
| [cursor-ai-context.mdc](../.cursor/rules/cursor-ai-context.mdc) | 48 | false | `[]` | 진입 링크 — 유지 |
| [archive-and-cleanup.mdc](../.cursor/rules/archive-and-cleanup.mdc) | 58 | false | memory-bank, archive | 유지 |
| [memory-bank-guide.mdc](../.cursor/rules/memory-bank-guide.mdc) | 61 | false | memory-bank | 유지 |
| [sentry-logs.md](../.cursor/rules/sentry-logs.md) | 71 | — | (프론트매터 없음) | `.md` — glob/적용 방식은 Cursor 설정에 따름 |
| [rust-first-architecture.mdc](../.cursor/rules/rust-first-architecture.mdc) | 97 | — | (프론트매터 없음) | 레거시 형식 — `alwaysApply`/`globs` 추가 검토 |
| [debugging-commit-failures.md](../.cursor/rules/debugging-commit-failures.md) | 111 | — | (프론트매터 없음) | 수동 `@` 규칙으로 쓰는 패턴 가정 |
| [auto-workflow.mdc](../.cursor/rules/auto-workflow.mdc) | 118 | true | `[]` | [workflow-modes.mdc](../.cursor/rules/workflow-modes.mdc)와 **역할 중복** 가능 — 축소·통합 후보 |
| [rust-api-conventions.mdc](../.cursor/rules/rust-api-conventions.mdc) | 164 | — | (프론트매터 없음) | Rust 작업 시에만 — `.mdc` YAML 정리 후보 |
| [dead-code-removal-guide.md](../.cursor/rules/dead-code-removal-guide.md) | 168 | — | — | 긴 가이드 — `@` 수동 |
| [workflow-modes.mdc](../.cursor/rules/workflow-modes.mdc) | 169 | true | `[]` | MB 워크플로 SoT — 유지 |
| [refactoring-guide.md](../.cursor/rules/refactoring-guide.md) | 319 | — | — | 분할 또는 에이전트 요청 전용 `.mdc` 전환 후보 |
| [clean-architecture-tdd.md](../.cursor/rules/clean-architecture-tdd.md) | 510 | — | — | 대형 — `@` 또는 glob `tests/**` 부착 검토 |
| [prd-adr-integration.mdc](../.cursor/rules/prd-adr-integration.mdc) | 786 | false | docs, memory-bank | **최대 용량** — 섹션별 파일 분할 또는 `description` 기반 로드만 강화 후보 |

**합계(대략):** 약 2,800줄(마크다운 본문 포함). `alwaysApply: true`가 **동시에** 켜지는 파일: `commit-verification`, `posthog-integration`, `ai-session-bootstrap`, `auto-workflow`, `workflow-modes` (5개) — [Cursor agent best practices](https://cursor.com/blog/agent-best-practices)에 맞춰 **주기적으로** “정말 매 턴 필요한가”를 검토한다.

## 분할·축소 후보 (우선순위)

1. **prd-adr-integration.mdc** — IMPLEMENT/ADR 전용 섹션을 `docs/` 내 링크 타깃으로 쪼개고, 규칙 파일에는 목차+링크만 남기기.
2. **auto-workflow.mdc vs workflow-modes.mdc** — 한쪽으로 통합하거나 `auto-workflow`를 `alwaysApply: false` + 강한 `description`으로 전환해 토큰 절약.
3. **clean-architecture-tdd.md / refactoring-guide.md** — glob 부착 또는 수동 규칙으로 전환.
4. **rust-*.mdc** — `apps/api/**` glob + 짧은 frontmatter 추가로 “Rust 터치할 때만” 자동 부착.

## nested `AGENTS.md` (PLAN P1 항목 3)

**상태:** 팀 합의 전 **스킵**. 도입 시 루트 [`AGENTS.md`](../AGENTS.md)에서 하위 파일로만 링크하고, 각 파일 **40줄 이하** 권장([Cursor nested AGENTS.md](https://cursor.com/docs/context/rules)).

---

## P1 에이전트/본인용 복붙 (다음 작업)

아래를 새 채팅 맨 위에 붙여 P1 잔여를 이어간다.

```text
Elevate — P1 잔여 (PLAN §4 P1)

main에 P0 머지 완료. 다음을 수행:
1) docs/CURSOR_RULES_AUDIT.md의 분할·축소 후보를 검토하고, 승인된 항목만 PR로 반영한다.
2) AI_ORCHESTRATION §2b verify 게이트가 팀 플로우와 맞는지 확인하고, 필요 시 AGENTS 표현만 다듬는다.
3) nested AGENTS.md는 합의 후에만 추가한다.

SoT: docs/features/PLAN-ai-native-workflow-evolution-2026-05.md §4 P1
```
