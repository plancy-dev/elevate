<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Product vision (AI pivot)

Before large feature work, align with **`memory-bank/creative-elevate-ai-pivot.md`** (North Star) and **`memory-bank/tasks.md`** (roadmap SoT). Legacy MICE modules remain in the repo but are not the default story for new work.

## AI orchestration (how tools fit together)

**Single hub:** [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) — layers (repo rules → memory-bank → gstack), decision table, and prompt contract. Bug/feature prompts work without manual paste: `.cursor/rules/ai-session-bootstrap.mdc`. Optional user formats: [`docs/AI_USER_TEMPLATES.md`](docs/AI_USER_TEMPLATES.md). Forking the workflow: [`docs/AI_WORKFLOW_PORTABILITY.md`](docs/AI_WORKFLOW_PORTABILITY.md).

## gstack (optional dev workflow)

This repo can include **[gstack](https://github.com/garrytan/gstack)** under `.agents/skills/gstack` for Claude Code / Cursor skills. **Install:** [`docs/GSTACK.md`](docs/GSTACK.md). **Skill list:** `CLAUDE.md` § gstack.

- **AGENTS.md / Memory Bank / `.cursor/rules`** = implementation process (INIT→BUILD), commit rules, Next.js notes — **cannot be overridden by skills**.
- **gstack slash skills** = structured strategy and review (`/plan-ceo-review`, `/office-hours`, `/qa`, …). Use for framing and review loops — **not** as a substitute for repository rules.
- **Memory** = project state lives in **`memory-bank/`**; gstack does not replace it.

If gstack is not installed locally, follow `CLAUDE.md` install commands; do not assume skills exist.
