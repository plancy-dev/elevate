# AI-native workflow — 문서 게이트 (구현 전)

**목적:** P0→P2 **문서·규칙 메타데이터**가 한 번에 main에 올라온 뒤, **별도 세션**에서 Hooks·MCP·CI 등 **구현**을 연다.  
**SoT:** 상위 PLAN은 [`PLAN-ai-native-workflow-evolution-2026-05.md`](./PLAN-ai-native-workflow-evolution-2026-05.md) §4. P2 상세·경계는 [`PLAN-ai-native-workflow-p2-rfc.md`](./PLAN-ai-native-workflow-p2-rfc.md).

---

## 1. PR에서 검수할 것 (리뷰어 / 본인)

문서 PR 머지 전에 아래 **경로가 브랜치에 존재**하고, 상호 링크가 깨지지 않는지 확인한다.

### P0 — 세션·외부 API 문서

| # | 산출물 | 경로 |
|---|--------|------|
| P0-1 | 긴 디버그·세션 리셋 | [`docs/MEMORY_BANK_SKILL_GUIDE.md`](../MEMORY_BANK_SKILL_GUIDE.md) |
| P0-2 | 전문가 프롬프트 ↔ 가이드 | [`docs/AI_EXPERT_PROMPTS.md`](../AI_EXPERT_PROMPTS.md) |
| P0-3 | 외부 API·결제·MCP 우선 | [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) §4 |
| P0-4 | (선택) Memory Bank 스킬 | [`.cursor/skills/elevate-work-harness/SKILL.md`](../../.cursor/skills/elevate-work-harness/SKILL.md) · INIT 별칭 [`elevate-memory-bank-bootstrap`](../../.cursor/skills/elevate-memory-bank-bootstrap/SKILL.md) |

### P1 — 정책·감사·GitHub

| # | 산출물 | 경로 |
|---|--------|------|
| P1-1 | verify if/then 게이트 | [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) **§2.6** · [`AGENTS.md`](../../AGENTS.md) Operating model |
| P1-2 | `.cursor/rules` 감사 표 | [`docs/CURSOR_RULES_AUDIT.md`](../CURSOR_RULES_AUDIT.md) |
| P1-3 | Issues vs PR 번호 | [`docs/DEV_PROCESS_GITHUB.md`](../DEV_PROCESS_GITHUB.md) |
| P1-4 | ADR 프로세스 기준 | [`docs/adr/README.md`](../adr/README.md) |
| P1-5 | 규칙 YAML 정리(예: 빈 globs) | `.cursor/rules/posthog-integration.mdc`, `completion-and-commit.mdc` 등 — 감사 표와 대조 |

### P2 — RFC만 (이 PR에 구현 없음)

| # | 산출물 | 경로 |
|---|--------|------|
| P2-1 | Hooks·Docs MCP·CI RFC | [`docs/features/PLAN-ai-native-workflow-p2-rfc.md`](./PLAN-ai-native-workflow-p2-rfc.md) |

### 허브 링크 (진입점)

| # | 용도 | 경로 |
|---|------|------|
| H-1 | 짧은 체크리스트 | [`docs/AI_USAGE.md`](../AI_USAGE.md) |
| H-2 | 단일 오케스트레이션 허브 | [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) **§2** 하네스 + §8 관련 목록 |
| H-3 | 작업 SoT | [`memory-bank/tasks.md`](../../memory-bank/tasks.md) |

---

## 2. 이 문서 PR에 넣지 않는 것 (다음 구현 PR)

다음은 **별도 PR**로만 다룬다. 본 문서 게이트 PR에 포함하면 범위가 섞인다.

- `.cursor/hooks/` 실제 스크립트·설정
- `mcp.json` / `mcp.json.example`의 **새 MCP 항목 추가**(문서만 예시 문구는 RFC·DEVELOPMENT 쪽 합의 후)
- Codex 등 **추가 GitHub Actions** 워크플로 파일
- 애플리케이션 런타임 코드 변경(문서 PR 예외 정책은 [`AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) **§2.6**)

자세한 문구는 P2 RFC **「문서 PR 범위 vs 다음 구현 PR」**을 따른다.

---

## 3. 구현 준비 완료(다음 세션) 조건

아래를 만족하면 **구현 세션**으로 넘어간다.

1. 위 §1 표의 파일이 **main에 머지**되어 있다.  
2. [`PLAN-ai-native-workflow-p2-rfc.md`](./PLAN-ai-native-workflow-p2-rfc.md)의 **팀 결정 3항**(Hooks 도입 여부, MCP 허용 목록, CI 실험 여부)에 대해 **슬랙/이슈 등에서 합의 또는 명시적 보류**가 있다.  
3. (선택) GitHub **이슈**「P2 구현 백로그」에 체크리스트를 옮겼고, 구현 PR은 `Refs #N`으로 연결한다.

---

## 4. 머지 직후 REFLECT (한 줄 예시)

PR 머지 후 코멘트 또는 `memory-bank/progress.md`에 한 줄로 충분하다.

> RFC §X 기본안 유지. 다음 스파이크: (1) Hooks 합의문 초안 (2) MCP 없이 verify 재확인 (3) CI는 nightly만 검토.

---

## 5. 빠른 명령 (로컬 존재 확인)

```bash
test -f docs/features/PLAN-ai-native-workflow-doc-gate.md && \
test -f docs/features/PLAN-ai-native-workflow-p2-rfc.md && \
test -f docs/adr/README.md && \
test -f docs/CURSOR_RULES_AUDIT.md && \
echo "doc-gate paths OK"
```
