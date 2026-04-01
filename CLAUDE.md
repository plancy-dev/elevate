@AGENTS.md

## Product direction

For **what we are building**, treat **`memory-bank/creative-elevate-ai-pivot.md`** as the North Star (flywheel, dual GTM, pivot phases). **`memory-bank/tasks.md`** is the roadmap SoT. Legacy **MICE** (events/venues/attendees) remains in the codebase but new features should target the AI platform direction unless explicitly scoped otherwise.

## AI orchestration

**Layered model and when to use gstack vs Cursor memory-bank workflow:** [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md).  
**Session bootstrap** (tasks/activeContext auto-read on impl/bugs): `.cursor/rules/ai-session-bootstrap.mdc`. **Prompt templates / fork checklist:** [`docs/AI_USER_TEMPLATES.md`](docs/AI_USER_TEMPLATES.md), [`docs/AI_WORKFLOW_PORTABILITY.md`](docs/AI_WORKFLOW_PORTABILITY.md).

## Skill routing

When invoking **gstack** slash skills alongside this repo:

1. **Repository rules win** — `AGENTS.md`, `.cursor/rules`, commit hooks (no `--no-verify`), Next.js 16 notes in `node_modules/next/dist/docs/`.
2. **Persist product decisions in-repo** — update `memory-bank/tasks.md` / `activeContext.md` after `/plan-*` or `/office-hours` so the next session is not skill-dependent.
3. **Test before ship** — prefer `pnpm verify` (or project scripts in `package.json`) over any generic “run tests” line inside a skill if they differ.

## gstack

[gstack](https://github.com/garrytan/gstack) provides optional slash-command skills (CEO/design/eng/QA/review/shipping). Vendored copy: **`.agents/skills/gstack`** (run `./setup` inside that directory if skills are missing).

**Web browsing:** Use **gstack `/browse`** for real browser testing when gstack is installed. Do not use conflicting chrome MCP tools alongside gstack’s browse rules if your environment defines both.

**Skill inventory (reference; run `./setup` for the exact list in your install):**  
`/office-hours`, `/plan-ceo-review`, `/plan-eng-review`, `/plan-design-review`, `/design-consultation`, `/design-shotgun`, `/design-html`, `/review`, `/ship`, `/land-and-deploy`, `/canary`, `/benchmark`, `/browse`, `/connect-chrome`, `/qa`, `/qa-only`, `/design-review`, `/setup-browser-cookies`, `/setup-deploy`, `/retro`, `/investigate`, `/document-release`, `/codex`, `/cso`, `/autoplan`, `/careful`, `/freeze`, `/guard`, `/unfreeze`, `/gstack-upgrade`, `/learn`

**Install (project-local, one-time):**

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git .agents/skills/gstack
cd .agents/skills/gstack && ./setup --host auto
```

If setup fails, see upstream [README](https://github.com/garrytan/gstack/blob/main/README.md) for Codex/Cursor/Factory options.
