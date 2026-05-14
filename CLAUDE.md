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

W2 D3 surface (2026-05-13):

- Phase 1 Discovery에서 명시한 fact (예: "generateStaticParams DB → 정적 빌드")를 같은 session 다음 decision (Path A 적합성) 평가에 적용 안 함 — Discovery 단계의 fact가 *동일 session 내 다음 decision*에 carry-over 되지 않는 가장 가까운 layer carrying failure → fix: Discovery report 매 fact를 path 선택 직전에 explicit re-read + 적용 mapping (fact ↔ decision 1:1 trace가 routine)
- Discovery fact가 *어느 repo의 fact였는지* cross-verify 안 함 — Path A MDX commit이 elevate repo가 아닌 gagejumsu repo로 paste된 사례. ADR-018 repo boundary anti-pattern (W2 D2 entry)의 *Code session prompt-level* 재현 → fix: 매 prompt 시점에 target repo 명시 + Code session pre-flight 4-step (`pwd` + `git remote -v` + content type match + Discovery fact origin repo 확인)
- Controller가 prompts를 target instance tag 없이 발송, Code session도 prompt-cwd mismatch 감지 안 함 — multi-instance Code session 환경에서 paste-to-wrong-instance 발생 (W2 D2 entry "Code session current status verify"의 시간 차원이라면 이건 *공간 차원* 재현) → fix: 프롬프트 prefix `[target repo only]` + Code session pre-flight prompt-cwd 검증 routine화
- Aggregate data가 refute한 dissent point가 primary user behavior로 vindicate 가능 — Marc Point 4 (3년+ 운영자 우월감)을 secondary research가 refute한 후 Threads 피드 empirical로 vindicate된 case. W2 D2 entry "secondary research ≠ primary verify 대체"의 *역방향 재발견* — refute 결론도 primary user behavior가 overturn 가능 → fix: secondary research conclusion은 empirical content test 후 *temporary*로 유지. Primary user behavior (audience direct voice/action)가 최종 ground truth
- "Path A" label을 "Direct Supabase INSERT" 후 "Direct MDX commit"으로 재정의 — 같은 session 내 path letter 재사용 → 실행 오류 risk (Code session이 어느 Path A인지 ambiguous) → fix: 매 path 명명 시 prefix (e.g., "Path A-DB", "Path A-MDX") 또는 path letter 1회만 사용. Spec letter는 session-scoped immutable
- Hero F → K iteration이 founder expertise framing 암시했으나 *Authority=0 reality*는 AI prompt direction pivot 시점에서야 surface — marketing direction lock 전 founder authority empirical base 확인이 routine에 없었음. ADR-018 verification rule v2 (product scope alignment)의 *founder side analog* → fix: marketing direction lock 전 founder authority empirical base 확인 routine — domain 발화 권한이 founder lived experience로 backable 한가
- Phase 1 Discovery가 publish path 구조는 명시했지만 actual adapter *구현*은 미 read — `publishContentItemToBlog` adapter의 unconditional boilerplate prepend가 Phase 2.5에서야 발견. 구조 read와 행위 read가 *분리된* failure mode → fix: Discovery 단계에서 *행위*까지 empirical read (function body 직접 확인). 구조 (queue 존재, adapter 이름)만 보고 행위 (transform / prepend / mutation) 추정 금지
- Threads URL preview cache는 *예약 시점에 lock* — 어제 single mega-post 예약 시 OG meta가 stale 상태였고 이후 OG deploy해도 예약된 post의 preview cache는 갱신 안 됨. *deploy timing dependency* anti-pattern → fix: 예약 전에 OG meta deploy 완료를 mandatory pre-condition으로 (`gh api repos/.../deployments` Production status 확인 후 schedule)
- Threads aggregate (조회수, 댓글수)에서 founder self-reply 분리 없이 audience signal로 간주 — "댓글 2" → personal narrative trigger evidence로 추정했으나 실제 founder self-reply 였음. Aggregate count = audience action으로의 *implicit equation* → fix: aggregate metric 보고 시 "founder self-action 제외" empirical 확인 routine — 댓글/like/share aggregate는 founder action subtract 후 보고
- Anthropic `web_fetch`가 production deploy 직후 old content/404 반환 가능 — 어제 essay 404 false alarm + 오늘 cost layer false alarm 2회 vindication된 stale edge cache pattern → fix: production deploy verification 시 (1) Vercel deployment status `gh api repos/.../deployments` 우선, (2) founder browser hard-refresh가 final truth, (3) `web_fetch`는 최후 보조 reference (단독 신뢰 금지)
- Threads URL preview cache busting empirical TBD — URL paste 시 preview render 안 되면 `?v=2` 등 query param으로 fresh fetch trigger 가능, publish 후 cache 자연 풀림 여부 미verify → fix: URL preview thumbnail render 확인 후 publish. 안 보이면 query param cache busting routine + publish-후 cache 갱신 timing empirical 누적

W2 D3 afternoon surface (2026-05-13):

- Generic skill recommendation vs project-specific ADR context mismatch — ui-ux-pro-max `search.py`가 "small business diagnosis tool minimal essay-first" query에 "Trust & Authority" style 권고 (certificates/badges/expert credentials) 반환. ADR-020 (가게점수 aggregator/tool-builder framing, anti-expert positioning)과 직접 충돌. Skill output은 generic best-practice, ADR은 project-specific override → fix: 모든 skill recommendation은 project ADRs alignment filter 통과 후 adoption. Skill output as-is 적용 금지. ADR override가 final ground truth. Empirical evidence: 2026-05-13 ui-ux-pro-max audit Phase 3 learnings (Drive file ID 1aB-DMcGISo3KejnSNpkrCt3R-V6d3TyA)
- Task completion 인지 vs empirical commit/push status gap — 사장님이 "A는 진행했고"라고 말한 시점에 실제는 prompt paste만 진행됐고 commit/push는 미진행 상태. Code session이 prompt를 queue에 retain하다가 후속 paste 시점에 queue에 남은 이전 prompt를 먼저 실행. 사장님 cognitive task state vs empirical git status mismatch → fix: 매 task 완료 보고 시 empirical commit SHA + push confirmation 명시 routine. "진행했고" 표현 시 commit/push 완료가 명시되지 않으면 paste만 진행으로 간주. Code session prompt paste 전에 이전 prompt 완료 empirical verify
- Code session single-repo view → cross-repo ADR false positive — Code session이 Elevate repo에서 ADR-021 commit 시 "ADR-019, ADR-020 missing"이라고 flag. 실제는 ADR-019, ADR-020이 가게점수 vertical repo에 거주 (ADR-018 boundary 정의). Code session은 current repo의 file system만 볼 수 있어서 cross-repo references를 missing이라고 추정 → fix: Code session prompt에 cross-repo expected references 명시 또는 false positive flag dismiss instructions 추가. ADR-018 Studio vs vertical boundary 인지가 Code session context에 필수
- Drive folder search vs page browser search 혼동 — 사장님이 Elevate Studio root folder에서 Cmd+F "2026-05-13" 검색 → 0/0 결과. 실제는 ADR-020 draft가 Content Drafts subfolder에 거주. Chrome browser page search는 current visible page 한정, Drive 전체 검색은 별도 (Drive 검색바) → fix: Drive에서 date-tagged file 찾을 때 (a) parent folder 진입 후 page search, (b) Drive 검색바 활용, (c) 답변에 file ID 직접 명시. Hybrid 권고: 내가 file 생성할 때 parent folder path + ID 명시. 사장님이 page search vs Drive search 인지

W2 D4 surface (2026-05-14):

- Funnel drop empirical 부재 상태에서 후속 feature build 결정 — ADR-022 commit (`8744efd`, 2026-05-14 W2 D4 morning)에서 가게점수 Stage 1.5 Marketing Image Generator positioning + Level 1 manual concierge implementation 결정. Commit 시점에 가게점수 landing funnel quantitative data 부재 — Vercel analytics "0 외부 결제" 인지만 있고 step-by-step conversion 측정 없음. 같은 날 PostHog 직접 query 결과: 14d landing funnel `$pageview` 55 → `landing_cta_clicked` 1 → `checkout_page_loaded` 1 → `diagnose_submitted` 0 → `result_viewed` 0. Step 1→2 conversion 1.82% (98.18% drop), Step 3→4 conversion 0% (100% drop). 즉 ADR-022가 부착하려던 base funnel이 사실상 작동 안 함. 후속 feature trigger 가능한 사용자 0명. Build for users who arrive (≥5% Step 1→N conversion) vs Build before users arrive (<5%) — 후자는 anti-pattern → fix: 신규 product feature ADR commit prerequisite로 (a) 핵심 funnel metric quantitative 측정 결과 ADR draft 첨부 의무화, (b) Step 1→N conversion threshold check (≥5%면 commit 가능 / <5%면 funnel fix가 first priority), (c) ADR template (Drive id `1KwN0V8laZDXGGD2cU7QBr26Dcl_r-l6J`)에 "Funnel baseline (quantitative)" section 추가. Meta-application: ADR-023 (Marketing Image Generator 베타 access mechanism, 2026-05-14 같은 날)에 이미 funnel baseline 명시 + threshold context 적용 — fix routine immediate adoption empirical. Reference: ADR-023 + PostHog gagejumsu project 413397 query (2026-05-14 W2 D4 afternoon)

(이후 매 sprint sync에서 add)
