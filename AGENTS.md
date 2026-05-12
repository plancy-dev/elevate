<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Design system (incremental)

Root **`DESIGN.md`** is the discovery entry (Stitch / [awesome-design-md](https://github.com/VoltAgent/awesome-design-md); Cal-inspired moodboard with §0 Elevate contract). Editor's Desk v3 implementation SoT: **`docs/adr/ADR-011-design-system-v3-editors-desk.md`**, **`docs/features/INIT-editors-desk-design-system.md`**, **`docs/features/PLAN-editors-desk-s0-s1-s2.md`**, and TOC IA lock **`docs/design/v3-creative/toc-ia-mapping.md`**. Superseded v2 docs are archived under **`memory-bank/archive/design-v2/`**. Prefer small, scoped changes (marketing vs dashboard vs shared tokens).

## Product vision (AI pivot)

Before large feature work, align with **`memory-bank/creative-elevate-ai-pivot.md`** (North Star) and **`memory-bank/tasks.md`** (roadmap SoT). The historical MICE schema was removed (`052_drop_mice_legacy_tables.sql`); new work targets AI platform surfaces.

## Blog authoring (public/member/premium)

When creating blog content, use **`docs/templates/blog-authoring-templates.md`** plus the three MDX templates in **`docs/templates/`** (`blog-post-public.mdx.example`, `blog-post-member.mdx.example`, `blog-post-premium.mdx.example`). Treat these as the default contract for `access_tier` and CTA structure. For **factual claims**, treat user-supplied links and repo paths as primary evidence (see **`docs/BLOG_POST_PIPELINE.md` §2.6** and autopublish **`primary_sources`** in **`docs/BLOG_AUTOPUBLISH_SDK.md`**); avoid presenting unverified community tips as established facts.

## AI orchestration (how tools fit together)

**Single hub:** [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) — **§2 세션 하네스**(Tier·INIT·턴 종료·Ops vs BUILD·verify) + 레이어·도구 선택. 버그·기능 요청도 `.cursor/rules/ai-session-bootstrap.mdc`로 Tier 0가 자동 적용된다. 전문가 복붙: [`docs/AI_EXPERT_PROMPTS.md`](docs/AI_EXPERT_PROMPTS.md). Fork [`docs/AI_WORKFLOW_PORTABILITY.md`](docs/AI_WORKFLOW_PORTABILITY.md).

- **Skill-first SoT 되돌리기** (`memory-bank/tasks.md` Skill-first 체크 vs 실제 팀 합의 불일치): 절차 SoT는 [`docs/MEMORY_BANK_SKILL_GUIDE.md`](docs/MEMORY_BANK_SKILL_GUIDE.md) § Skill-first `[x]` 가 실제 합의와 다를 때 — 오케스트레이션 §9 자동화 링크만 [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) §9.

### Operating model: INIT → PLAN → CREATIVE → BUILD → REFLECT → ARCHIVE

**Principle:** These phases are **mandatory by default** and scale with **complexity** (see `.cursor/rules/workflow-modes.mdc`). Skipping PLAN for **L2+**, or CREATIVE for **L3+** (when UX, data shape, or cross-cutting behavior changes), is wrong **unless the user explicitly opts into a fast path** (“L1 only”, “skip to BUILD”, hotfix with stated risk).

| Level | Default phase chain |
|------|----------------------|
| **L1** | INIT → BUILD → REFLECT |
| **L2** | INIT → PLAN → BUILD → REFLECT |
| **L3** | INIT → PLAN → CREATIVE → BUILD → REFLECT |
| **L4** | Full chain **+ ARCHIVE** (and often ADR / migration notes) |

**Phase → Cursor mode → minimum artifact**

| Phase | Cursor (typical) | Minimum artifact |
|-------|------------------|-------------------|
| **INIT** | Ask / short Agent | 형식 **[`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) §2.2**; **L1–L4**; SoT refs [`memory-bank/tasks.md`](memory-bank/tasks.md), [`memory-bank/activeContext.md`](memory-bank/activeContext.md) |
| **PLAN** | **Plan** | Plan + risks + verification idea (in chat or linked notes); align with [`memory-bank/tasks.md`](memory-bank/tasks.md) |
| **CREATIVE** | **Plan** | Decision logged [`memory-bank/creative-*.md`](memory-bank/), ADR, or `docs/features/…` as appropriate |
| **BUILD** | **Agent** | Code + **`pnpm verify`** when material changes apply — gate: [`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) **§2.6** |
| **REFLECT** | Ask / **Debug** | What shipped, gaps, follow-ups → [`memory-bank/progress.md`](memory-bank/progress.md) / `tasks.md` |
| **ARCHIVE** | Agent | Durable summaries → [`memory-bank/archive/`](memory-bank/archive/) per `.cursor/rules/archive-and-cleanup.mdc` |

**gstack (layer C — optional):** Load Memory Bank **first**; then use **one or two** slash skills per phase — do **not** substitute gstack for `AGENTS.md`, hooks, or `pnpm verify`. Install: [`docs/GSTACK.md`](docs/GSTACK.md). Inventory: [`CLAUDE.md`](CLAUDE.md) § gstack.

| Phase | Suggested gstack skills (pick sparingly) |
|-------|------------------------------------------|
| INIT | `/office-hours` (new idea / wedge), repo exploration via vendored browse/explore patterns where useful |
| PLAN | `/plan-eng-review`, `/autoplan` (full plan gauntlet), `/plan-ceo-review` (scope / ambition) |
| CREATIVE | `/plan-design-review` (UI/UX plan), `/plan-ceo-review` (product tradeoffs) |
| BUILD | Cursor **Task** subagents (`implementer`, `frontend-engineer`, `debugger`) align with BUILD intent; gstack `/ship` does **not** override repo verify (see below) |
| REFLECT | `/review` (pre-merge diff), `/qa` or `/qa-only` (live site), `/investigate` (RCA), `/retro` (periodic) |
| ARCHIVE | `/document-release` (post-ship doc sync) |

### Vercel plugin (optional — deploy / env harness)

Official **Vercel Plugin for AI coding agents** adds Vercel-specific slash commands and skills in supported tools (including Cursor). It is **optional** and **does not replace** `AGENTS.md`, Memory Bank, `pnpm verify`, or gstack.

- **Docs:** [Vercel Plugin](https://vercel.com/docs/agent-resources/vercel-plugin)
- **Install:** `npx plugins add vercel/vercel-plugin` (see upstream for Node / Bun prerequisites)

**Team convention — when to use which slash (suggested)**

| When | Slash command |
|------|----------------|
| Before promote / merge — deployment health, env overview | `/vercel-plugin:status` |
| Sync or diff local vs Vercel env | `/vercel-plugin:env` |
| Deploy preview or production | `/vercel-plugin:deploy` or `/vercel-plugin:deploy prod` |
| New link / bootstrap / first env setup | `/vercel-plugin:bootstrap` |
| Marketplace integrations | `/vercel-plugin:marketplace` |

Skills such as `/vercel-plugin:nextjs` are **on-demand** when you need vendor-specific depth. **Telemetry:** set `VERCEL_PLUGIN_TELEMETRY=off` if the team disables plugin telemetry ([docs](https://vercel.com/docs/agent-resources/vercel-plugin#telemetry)).

**Performance / maturity loop:** Use [`docs/AI_AGENT_MATURITY_REPORT.md`](docs/AI_AGENT_MATURITY_REPORT.md) (P1–P5, T1–T2) as the **scorecard**; attach gstack review or QA output to REFLECT as **evidence**, not as a substitute for CI or `pnpm verify`.

### Session handoff (closing a substantive turn)

규약(언제 블록 B/C/D인지 포함): **[`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) §2.4**. 원문 블록: [`docs/AI_EXPERT_PROMPTS.md`](docs/AI_EXPERT_PROMPTS.md).

When you **implemented or changed code**, **ran ops/gates**, or **updated Memory Bank / GitHub evidence**, end the reply with a **copy-paste bundle** from [`docs/AI_EXPERT_PROMPTS.md`](docs/AI_EXPERT_PROMPTS.md): paste **Block A** in full, plus **Block B** (next concrete task), **Block C** (if the user asked “what next”), or **Block D** (ops-only follow-up). Do not substitute with “see the doc” alone. **Skip** for trivial one-off Q&A (definitions, single-line nits, no repo impact). Full block text stays in the doc so this file does not go stale.

**Ops vs 제품 BUILD:** 레이블을 섞지 말 것 — **[`docs/AI_ORCHESTRATION.md`](docs/AI_ORCHESTRATION.md) §2.5**.

## GitHub Issues · remote task queue

**Process (issues ↔ PR ↔ gstack):** [`docs/DEV_PROCESS_GITHUB.md`](docs/DEV_PROCESS_GITHUB.md). **Studio scene render epic pointer:** [`.github/DESIGN.md`](.github/DESIGN.md). List open Studio-tagged issues locally: `pnpm issues:studio` (requires [GitHub CLI](https://cli.github.com/) `gh auth login`).

## gstack (optional dev workflow)

This repo can include **[gstack](https://github.com/garrytan/gstack)** under `.agents/skills/gstack` for Claude Code / Cursor skills. **Install:** [`docs/GSTACK.md`](docs/GSTACK.md). **Skill list:** `CLAUDE.md` § gstack. **Phase → skill hints** are in **§ AI orchestration → Operating model** above (avoid duplicate routing tables here).

- **AGENTS.md / Memory Bank / `.cursor/rules`** = implementation process (INIT→ARCHIVE), commit rules, Next.js notes — **cannot be overridden by skills**.
- **gstack slash skills** = structured strategy and review (`/plan-ceo-review`, `/office-hours`, `/qa`, …). Use for framing and review loops — **not** as a substitute for repository rules.
- **Memory** = project state lives in **`memory-bank/`**; gstack does not replace it.

If gstack is not installed locally, follow `CLAUDE.md` install commands; do not assume skills exist.

## Subagents reference

`.claude/agents/` (Phase 2, W2 D2 Day 1):

- **marc-dissent** — indie hacker pragmatist counter-perspective (Pieter Levels archetype). PROACTIVELY applied at every strategic decision before founder explicit lock. 5-point analysis: over-engineering / 80%-spec / unverified assumptions / hidden risk / no compromise. Scope: strategic decisions only (audience copy, pricing, positioning, ADR, vertical features) — NOT code review.
- **dissent-verifier** — Generator/Evaluator separation (OpenAI Codex pattern). PROACTIVELY invoked AFTER founder responds to dissent. Verifies whether response is substantive engagement or surface rationalization. Surfaces most-likely-correct rejected dissent point.

## Cursor Cloud specific instructions

### Environment

- **Node.js 20** via nvm (`.nvmrc`), **pnpm 9+** (global install; CI uses the version pinned by `pnpm/action-setup` in GitHub Actions).
- Secrets are injected as environment variables. A `.env.local` must be created (gitignored) so Next.js picks up `NEXT_PUBLIC_*` vars at build/dev time. Use a script or copy from `.env.local.example` and fill from env.
- The update script runs `pnpm install` only. nvm/node/pnpm must already be on PATH from the VM snapshot.

### Running services

| Service | Command | Notes |
|---------|---------|-------|
| Next.js dev | `pnpm dev` | Port 3000, webpack mode. Use `--webpack` flag (already in script). |
| Lint | `pnpm lint` | ESLint 9 flat config |
| Typecheck | `pnpm typecheck` | `tsc --noEmit` |
| Unit tests | `pnpm test` | Vitest, `tests/unit/`. Some suites assert **absent** `NEXT_PUBLIC_*` defaults; if the cloud VM injects `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` / checkout link vars, those cases can fail—run `pnpm verify` with a clean env slice if needed. |
| Full CI check | `pnpm verify` | lint + typecheck + test + build |
| Build | `pnpm build` | Next.js production build |

### Gotchas

- **Unit test env leakage**: `posthog-public.test.ts` and `blog-subscription.test.ts` include branches that assume env vars are unset. Full secret injection in Cloud Agent can flip those branches—prefer comparing against CI (fixed env) or unsetting only the conflicting `NEXT_PUBLIC_*` keys for a test run.
- **Husky pre-commit**: runs `lint-staged` (ESLint on staged files). Never use `--no-verify`.
- **Supabase**: No local Supabase needed — the app connects to a remote Supabase project via env vars. Integration tests (`pnpm test:integration`) require `SUPABASE_INTEGRATION_TEST=1`.
- **sharp rebuild**: After `pnpm install`, sharp may warn about ignored build scripts. Run `pnpm rebuild sharp` if image optimization breaks. The `pnpm.onlyBuiltDependencies` in `package.json` lists `sqlite3`; sharp is handled by its prebuilt binaries.
- **Next.js 16**: Read docs in `node_modules/next/dist/docs/` for API differences from training data.

## Mobile orchestration (Phase 4 emerging)

Karpathy harness Phase 4 trial (W2 D2+):

- Claude Code Remote Control enabled for elevate repo
- Cowork + Dispatch (Anthropic mobile app) for non-code file/task ops
- Mac awake + Claude app open requirement (current Remote Control limitation)
- Trial phase — production dependency 회피 until W4 stability sign-off

## Cross-tool consistency

Cursor / Claude Code / Codex / Windsurf 모두 본 `AGENTS.md`를 root reference로 읽는다. Tool-specific files (`.cursor/`, `.claude/`, `.windsurf/`, etc.)는 본 standard 위에 layer — 상충 시 `AGENTS.md` + Memory Bank + commit hooks가 우선 (see `CLAUDE.md` § Skill routing rule 1).
