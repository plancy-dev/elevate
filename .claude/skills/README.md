# Skill Registry — Elevate

Anthropic Agent Skills config for the elevate repo. Skills are codified from observed chat-session behavior and shared across all Claude sessions working in this codebase.

## Status

- **Phase 1 production-ready**: 2026-05-11
- **7 skills active** (listed below)
- **Standard**: Anthropic Agent Skills (`.claude/skills/<name>/SKILL.md` with YAML frontmatter + markdown body)
- **Phase 2-4 deferred** (see below)

## Skill overview

| name | primary trigger | output type | invocation mode |
|---|---|---|---|
| `control-tower` | cross-session synthesis | chat synthesis + decision lock | auto + explicit |
| `strategic-architect` | ADR drafting | `.md` file write | auto |
| `essay-writer` | longform Essay 1,500-2,500w | `.mdx` file write | auto |
| `dispatch-writer` | weekly Dispatch 400-700w | `.md` file write | auto + Thursday cron |
| `funnel-analyst` | conversion friction analysis | chat analysis | auto + explicit |
| `code-reviewer` | commit + push verification | bash git commands | auto |
| `gagejumsu-vertical` | 가게점수 decisions | chat decision + reverse routing | auto + explicit |

## Composition patterns

Skills chain in these recurring ways:

- `gagejumsu-vertical` → `strategic-architect` (vertical observation → ADR codification)
- `funnel-analyst` → `strategic-architect` (friction analysis → ADR codify if pattern repeats)
- `control-tower` → `strategic-architect` (decision lock → ADR draft)
- `control-tower` → `essay-writer` / `dispatch-writer` (cross-session synthesis → content draft)
- All skills → `code-reviewer` (commit + push verification gate)

## Trigger overlap resolution

When multiple skills could match, the canonical routing:

| Request signal | Use this skill | Not this skill | Reason |
|---|---|---|---|
| "ADR 작성" / "decision codify" | `strategic-architect` | `essay-writer` | ADR is structured doc, not longform narrative |
| "Marc-dissent in dispatch" | `dispatch-writer` | `control-tower` | Marc voice is dispatch register, control-tower is upstream synthesis |
| "Funnel friction 분석" | `funnel-analyst` | `control-tower` | Funnel is specialized (PostHog + (a)(b)(c)(d) lenses) |
| "Vertical pricing ADR" | `gagejumsu-vertical` → `strategic-architect` | `strategic-architect` alone | Chain: vertical context first, then ADR formalism |
| "Sprint synthesis" | `control-tower` | (no alternative) | Cross-session synthesis is control-tower's primary scope |

## Phase 2+ deferred

Phase 1 codifies skill bodies only. Future phases:

- **Phase 2**: `.claude/agents/` subagent configuration (long-running, isolated context agents per skill).
- **Phase 3a**: `.claude/hooks/` (pre/post-tool, pre-commit augmentation, slash-command hooks).
- **Phase 3b**: Cloud cron (`claude trigger` for scheduled skill invocations, e.g. Thursday Dispatch auto-draft).
- **Phase 4**: Ralph loop pattern (code-side sandboxed iterative refinement loops).
- **Meta-skill layer**: `task-router`, `phase-tracker`, `failure-handler` — orchestration skills that route between skills.
- **Missing skills (5)**: `boardroom-simulator`, `infrastructure-designer`, `qa-tester`, `social-content-designer`, `task-router`.

## References

- Anthropic Agent Skills docs: <https://code.claude.com/docs/en/skills>
- Initial commit: `0610720` (Phase 1 Skill registry draft — 7 SKILL.md)
- Iterate cycle 1: `43c69ca` (essay-writer codify 9 카피 원칙 + Pulitzer 6 verbatim), `88bb741` (remove stale Out of scope caveat)
