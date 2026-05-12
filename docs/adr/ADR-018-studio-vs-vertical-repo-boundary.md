# ADR-018: Studio level vs vertical level repository boundary

**Date**: 2026-05-12
**Status**: Accepted
**Context**: W2 D2 sprint에 fe99d4c (Hero F lock, 가게점수 vertical content)이 Elevate Studio repo에 잘못 commit됨. Founder surface로 catch + revert. Layer mismatch가 Marc Point 5 (wrong layer)의 meta-irony 재현 — 컨트롤타워가 *audience layer*뿐 아니라 *repo layer*도 wrong layer 선택.

## Decision

Repository boundary를 다음 matrix로 명시.

### `plancy-dev/elevate` — Studio level

Scope:

- Brand definitions (ADR-014 Elevate Inc. Studio)
- Harness engineering (CLAUDE.md, AGENTS.md, `.claude/agents/`, `.claude/hooks/`, `.claude/skills/`)
- Cross-vertical ADRs (Studio-level decisions spanning all verticals)
- Skills registry
- Ops mode docs (`memory-bank/`)
- Studio brand publications (`content/blog/`, `content/dispatches/`, `content/ebooks/`) — Elevate brand 자체의 publication

### `rayleighko/gagejumsu` (and future per-vertical repos) — Vertical level

Scope:

- Product code (Next.js app, API, diagnosis logic)
- Marketing content (`content/marketing/` — Hero copy, carousel, landing page copy)
- Vertical-specific ADRs (예: ADR-017 KRW payment localization)
- Vertical-specific data analysis
- Vertical-specific launch evidence

## Verification rule (pre-commit routine)

모든 commit 전 *target repo verify*:

1. 현재 `pwd` 확인
2. Content type → repo layer match check
3. Mismatch detected → 다른 repo로 redirect

## Rationale

- Studio brand가 multiple verticals 출시 예정 (가게점수 = vertical 1, vertical2/3 추후)
- 각 vertical은 독립적 product + marketing + ADR 사이클
- Studio repo가 vertical content 누적되면 *scope creep + layer mismatch*
- Marc Point 5 (wrong layer)의 meta-level 재현 방지

## Consequences

- W2 D1 13 commits + W2 D2 commits retroactive audit 필요 (별도 sprint)
- 향후 commit pre-hook 또는 pwd-verify routine 자동화 검토
- Anti-pattern catalog v2에 *6th + 7th entries* 추가 (layer mismatch + directory invisible assumption, 0e9e765 commit)

## Reference

- fe99d4c (Elevate revert, reflog 30일+ 보존)
- 6825d56 (Hero F lock landed in 가게점수 main)
- f0ee33a (Carousel v1 landed in 가게점수 main)
- Drive: Elevate Studio/phase2-findings-2026-05-12.md
- Drive: Elevate Studio/carousel-2026-05-12-cafe-failure-reality.md
- Marc dissent Point 5 (wrong layer audience analysis, original surface)
- W2 D1 ADR-014 (Elevate Inc. Studio brand definition)
