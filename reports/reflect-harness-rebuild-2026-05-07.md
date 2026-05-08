# REFLECT — Agent harness rebuild (documentation / skills only)

**Date:** 2026-05-07 UTC  
**Scope:** Markdown, `.cursor/rules/*.mdc`, project Cursor skills (`elevate-*`). No application runtime code touched. **`pnpm verify`:** omitted by team convention for docs-only wave; 재개 시 **`AI_ORCHESTRATION.md` §2.6** 따름.

## Shipped

- Single canonical harness block in **`docs/AI_ORCHESTRATION.md` §2**: Tier 0/1, unified INIT completion format, complexity/phase table, session handoff, Ops gate vs product BUILD, verify (**§2.6**).
- Downstream duplication removed or converted to links in **`AGENTS.md`**, **`.cursor/rules/`** (`ai-session-bootstrap`, `auto-workflow`, `workflow-modes`), **`docs/MEMORY_BANK_SKILL_GUIDE.md`**, **`docs/AI_EXPERT_PROMPTS.md`**, **`elevate-work-harness`** (+ alias stubs), **`memory-bank/README.md`**, **`DESIGN.md` §0**, **`CLAUDE.md`**, cross-doc section renumber (**§2b→§2.6**, old **§8 automation→§9**, prompt **§3→§4** where cited).

## Intentional overlap

- **`AGENTS.md`** retains Operating model principles, phase→gstack table, and Vercel plugin table (product charter).

## 다음 세션용 블록 B

```text
[역할·로드] docs/AI_EXPERT_PROMPTS.md §2 블록 A 전문을 그대로 적용한다.

[요청]
rg "§2b|AI_ORCHESTRATION\\.md.*§8[^0-9]|Orchestration §3([^0-9]|$)" 저장소 전체 확인 후 레거시 절 번호·깨진 링크 패치(`AI_ORCHESTRATION` §9 자동화, §4 프롬프트, §2.6 verify). 새 SoT 파일은 만들지 않는다.

[완료 조건]
- [ ] 검색 결과 0건 또는 각 잔존처에 의도 주석 한 줄
- [ ] 순수 문서면 verify 생략 합의를 PR 요약 한 줄로 명시
```
