@AGENTS.md

## Studio overview

Elevate Studio brand (per ADR-014). Solo founder running AI-augmented Studio building vertical products. Primary vertical: 가게점수 (Korean self-employed marketing diagnosis). External positioning: founder-led, Studio as adjective. Internal: holding entity for vertical product portfolio.

## ADR index

See `docs/adr/`. Active list:

- ADR-005 Payment infrastructure (USD default, Lemon Squeezy)
- ADR-012 Q2 2026 positioning (media-first, evolved into ADR-014)
- ADR-013 Marketing CTA + PostHog instrumentation
- ADR-014 Elevate Studio brand identity
- ADR-015 Content Product Design (Essays + Studio Dispatch)
- ADR-016 Content Infra Redesign (stub)
- ADR-017 Vertical Payment Localization (KRW for 가게점수)

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

## Skills registry

See `.claude/skills/README.md`. Phase 1 complete (2026-05-11) — 7 skills:

- control-tower (cross-session synthesis)
- strategic-architect (ADR drafting)
- essay-writer (longform Essays per ADR-015)
- dispatch-writer (weekly Studio Dispatch per ADR-015)
- funnel-analyst (conversion friction diagnosis)
- code-reviewer (commit + push verification)
- gagejumsu-vertical (vertical product decisions)

Open standard — skills work across Claude Code, Codex CLI, Gemini CLI, Cursor, Copilot without modification.

## Subagents

See `.claude/agents/`. Phase 2 (W2 D2 Day 1):

- marc-dissent (indie hacker pragmatist counter-perspective, Pieter Levels archetype)
- dissent-verifier (Generator/Evaluator pattern for founder's response to dissent)

## Hooks

See `.claude/hooks/`. Phase 2 (W2 D2 Day 1):

- session-start.sh (load skill registry + memory-bank + anti-patterns)
- post-edit.sh (Prettier + ESLint auto)
- pre-push.sh (tests + commit convention verify)

## Phase progression — Karpathy harness engineering 5-phase

- Phase 1 (complete W2 D1): Skill registry
- Phase 2 (W2 D2+): Subagents + CLAUDE.md/AGENTS.md filesystem memory consolidation + hooks partial
- Phase 3 (W3): Full hooks + cross-tool AGENTS.md unification + skill empirical eval
- Phase 4 (W4+): Mobile remote ops (Dispatch + Code Remote native) + cron auto-trigger
- Phase 5 (W5+): OpenCode (tool-agnostic harness, Anthropic lock-in 회피)

## Active sessions / surfaces

- [명진] Elevate - 컨트롤타워 (Claude chat, main session)
- [elevate] Code (Claude Code terminal, implementation)
- [gagejumsu] Code (Claude Code terminal, vertical)
- Claude Code Remote Control (W2 D2 first trial)
- Cowork + Dispatch (W2 D2 first trial, optional)
- 11 sessions deprecation in progress per Karpathy critique

## Voice rules

ADR-014 lock:

- Founder is first noun, Studio is adjective
- Build documentation tone, not product pitch
- Vertical-specific naming (가게점수, not "our product")

## Anti-patterns / Failure modes (growing list)

Hashimoto discipline: 매 새 failure 발견 시 add — engineer permanent fix for each.

W2 D1 surface (2026-05-11):

- Cross-session paste cycle (4 occurrences in single sprint) → fix: Drive integration + Code Remote (W2 D2)
- Drive MCP scope limitation 미사전 verify → fix: 사전 권한 test 필요
- Founder mental model = audience mental model 가정 → fix: Marc dissent + user verification (Marc D option)
- Anthropic product knowledge cutoff 이후 feature를 "없다"고 단언 → fix: search-first principle (이후 default)
- Sub-headline duplicate carrying (Hero headline) → fix: Marc 5-point analysis
- Single-layer dissent trust → fix: dissent-verifier (Generator/Evaluator pattern)

W2 D2 surface (2026-05-12):

- Operationally-true content를 spec 작성 시 *replacement default* 가정 → fix: merge-not-replace explicit + dangling reference check 명시 (Commit 1 abort + redirect에서 catch)
- `.claude/agents/` subagent file 작성 ≠ Claude Code dispatcher 자동 register → fix: Phase 3 hooks 등록 시 `settings.json` wiring + fresh session restart verify (Phase 2.1 first invocation에서 surface)
- Auto mode classifier의 의도된 friction (default-branch guard 등)을 *bypass routine*으로 만들면 classifier 자체 무의미 → fix: `!` prefix는 one-time bypass only, `settings.json` permission rule 추가는 case-by-case 신중 결정
- Subagent invocation fallback (general-purpose + persona inject) 성공 시 *operational gap*을 *masked* 가능 — workaround 자체가 permanent solution으로 변질 risk → fix: Phase 2 Day 2에 subagent dispatcher 정식 해결 priority
- Primary user verify (실제 user contact)와 secondary market research (data 분석)는 *상호 보완 not 대체* → fix: secondary research 진행 시에도 primary verify track 별도 유지 (특히 결제 게이트 inversion 같은 *behavioral* hypothesis는 *audience direct voice가 ground truth*)
- Studio level (Elevate) vs vertical level (가게점수) repo boundary 미명확화 → vertical content (Hero copy, carousel)가 Studio repo에 commit되는 case 발생 (fe99d4c → revert + 6825d56/f0ee33a로 redirect). Marc Point 5 (wrong layer)의 meta-level 재현 — 컨트롤타워가 *audience layer*만이 아니라 *repo layer*에서도 동일 anti-pattern 재현 → fix: ADR-018 Studio vs vertical repo boundary + 모든 commit 전 *target repo verify (pwd + content type match)*가 routine
- 컨트롤타워가 repo directory structure를 *implicit assumption으로 진행* (예: `content/` folder를 marketing-only로 가정, 실제로는 `blog/`, `dispatches/`, `ebooks/` pre-existing) → Code session이 *empirical fact로 corrections* (controller↔supervisee feedback loop). 진짜 가치 있는 control mechanism → fix: 컨트롤타워 prediction에 *directory state empirical verify*가 default (`ls`/`find` 또는 Code session ping)
- 컨트롤타워가 *Code session 실제 진행 상태 인지 실패* — Code session이 이미 진행한 작업을 컨트롤타워가 모르고 *redundant commission* 발행 → meta-meta-level wrong layer (Phase 2.5 진행 후 컨트롤타워가 동일 작업 재 paste 요청한 case) → fix: 컨트롤타워 commission 전 *Code session current status verify* (founder ping 또는 Code session output 직접 read)가 default
- Product scope vs Hero copy alignment 미verify → Hero F (cost layer pivot)이 actual product scope (visibility-only)와 false positioning 발생 (Phase 2.7 founder 스크린샷 share로 surface). Marc dissent Point 5 해결책 자체가 *3rd layer mismatch (L3)* 도입 → meta-meta-meta-irony. Layer mismatch가 *해결 과정에서 재도입*된 case → fix: ADR-018 verification rule v2 — product scope vs marketing copy alignment check가 모든 Hero lock 전 mandatory 4번째 step

(이후 매 sprint sync에서 add)
