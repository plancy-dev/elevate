@AGENTS.md

## Product direction

For **what we are building**, treat **`memory-bank/creative-elevate-ai-pivot.md`** as the North Star (flywheel, dual GTM, pivot phases). **`memory-bank/tasks.md`** is the roadmap SoT. The old MICE Postgres domain was dropped in migration **`052_drop_mice_legacy_tables.sql`**; new features target the AI platform direction unless explicitly scoped otherwise.

## AI orchestration

**Layered model / session harness (Tier 0·INIT·턴 종료·Ops vs BUILD):** [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) **§2**. **INIT→ARCHIVE + gstack:** **[`AGENTS.md`](./AGENTS.md) § AI orchestration → Operating model** (제품 헌장).  
**Session bootstrap** (tasks/activeContext auto-read on impl/bugs): `.cursor/rules/ai-session-bootstrap.mdc`. **Prompt templates / fork checklist:** [`docs/AI_USER_TEMPLATES.md`](docs/AI_USER_TEMPLATES.md), [`docs/AI_WORKFLOW_PORTABILITY.md`](docs/AI_WORKFLOW_PORTABILITY.md). **End substantive turns** with the [`docs/AI_EXPERT_PROMPTS.md`](docs/AI_EXPERT_PROMPTS.md) handoff (**Block A** + **B / C / D** as appropriate); 규약 상세는 [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) **§2.4–§2.5**. scope and exceptions: [**`AGENTS.md` — Session handoff**](./AGENTS.md#session-handoff-closing-a-substantive-turn).
Skill-first SoT를 되돌릴 때는 [`docs/MEMORY_BANK_SKILL_GUIDE.md`](docs/MEMORY_BANK_SKILL_GUIDE.md) § Skill-first `[x]` 가 실제 합의와 다를 때를 따르고, 오케스트레이션 §9 자동화 링크만 [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) §9를 본다.

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

Cursor 통합 하네스에서의 gstack **브릿지**(벤더 분리·스파스 사용): [`.cursor/skills/elevate-work-harness/SKILL.md`](.cursor/skills/elevate-work-harness/SKILL.md) §7; **슬래시 전체 목록**은 위 *Skill inventory*만 SoT.

**Install (project-local, one-time):**

```bash
git clone --single-branch --depth 1 https://github.com/garrytan/gstack.git .agents/skills/gstack
cd .agents/skills/gstack && ./setup --host auto
```

If setup fails, see upstream [README](https://github.com/garrytan/gstack/blob/main/README.md) for Codex/Cursor/Factory options.
