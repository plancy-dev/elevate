# Elevate — Operations & content mode (2026 Q2)

**Effective:** 2026-05-06 · **Horizon:** ~3 months (revisit with 가게점수 progress + Elevate audience data).

This file is the **SoT for “what we do / don’t do on Elevate”** during the content-channel phase. Changes here supersede ad-hoc chat; substantive updates should be dated at the top or in a short changelog section.

---

## TL;DR

Elevate pauses vertical AI **product build** and enters **content-channel mode**: Essays 1–2/week + Studio Dispatch every Thursday 9 AM ET (NY time, DST-aware), SEO + email list, INIT/STAB ops only.

The **first vertical** is **`가게점수`** (1인 카페·디저트·베이커리 사장님 대상 **marketing diagnosis** AI) — but as a **separate product**: new domain, new repo, new brand, **no code import from Elevate**, **no 가게점수 work in this repo** (separate Cursor agent / progress).

Elevate does **not** run 가게점수; it shares **direction and builder insights** with the Elevate audience.

---

## Elevate vs 가게점수 (boundary)

| | Elevate (this repo) | 가게점수 |
|---|---------------------|------------|
| Domain / brand | elevate.ai.kr (existing) | 가게점수 (separate) |
| Repo | This monorepo | **Separate** — fresh start |
| Cursor / agent | Elevate sessions only | Own sessions; **do not touch from Elevate** |
| Audience | Generic professionals, builders, AI workflow ICP | 1인 카페·디저트·베이커리 사장님 |
| Metrics | Own analytics / waitlist / Dispatch | Own product metrics |

**Rules**

- No **advertorial** for 가게점수 on Elevate. Natural **mentions** when topic fits = OK.
- **Cross-promotion** to another list only with **explicit consent** (signup option or separate form).
- **One** post-launch **glass announcement** on Elevate = OK; after that, light mentions only.
- Product detail, pricing, demo = **가게점수’s** channels.

**가게점수 (concept only — not built here)**

- Paste shop info → scored diagnosis (e.g. “47/100”) + action plan.
- Commercial shape (informing market positioning only): $7 = one diagnosis + 30-day access + one free re-diagnosis (exact packaging lives in 가게점수 repo).

---

## Direction background (summary)

Korean “desire axis” verticals with strong incumbents (comparison, wealth, appearance, kids’ education, etc.) show **saturation**: domain leaders already ship AI deeply (examples named in strategy docs: e.g. 자소설닷컴, 콴다, 메링, 잼페이스, 운세박사-class players — not an exhaustive competitive report in this file).

The **gap** we want to explore first is **self-employed / small-business unified AI assistant**, narrowed to **solo café · dessert · bakery** owners (audience-first + parallel cash-flow **16-week** path; detailed market notes will live under **가게점수** `docs/decisions/`, not here).

---

## Elevate’s new role — content & media channel

Aligns with **ADR-012 (media-first)** and **commits harder** to it: **audience-first build**, ship insight and consistency before new product surface area.

### Paused / not doing (~3 months)

- New **product** features (no new user-facing capability projects).
- **Prompt Studio MVP** build — North Star in [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md) stays **recorded** but **execution paused** (see banner there).
- GitHub **#60** (hero/positioning), **#62** (sidebar), **#61** (pricing), **#73** (hooks/MCP/CI implementation) — **defer** unless pure-docs maintenance.
- **New components, new pages, design refactors** (excluding broken-build / legal / security fixes if any).
- **Lemon Squeezy / Polar** — **maintenance only** (deps, security).
- **No new ADRs** — existing **ADR-005**, **ADR-012**, **ADR-013** remain authoritative.

**ADR path references (actual filenames in repo)**

- [`docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md`](../docs/adr/ADR-005-payment-rails-lemon-primary-toss-deferred.md) — payments / Lemon-first.
- [`docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md`](../docs/adr/ADR-012-positioning-2026-q2-scenario-a-media-first.md) — media-first positioning.
- [`docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md`](../docs/adr/ADR-013-marketing-cta-instrumentation-phase-1.md) — marketing CTA + PostHog instrumentation (STAB evidence under `reports/`).

### Doing (~3 months)

- **Essays** — **1–2/week**.
- **Studio Dispatch** — **Thursday 9 AM ET** (NY time, DST-aware).
- **SEO** + **email list** growth.
- **INIT/STAB** ops: incidents, dependency updates, PostHog monitoring, whitelist signups.
- **No 가게점수 implementation** in this codebase.

---

## Content topic axes (Essays) — rotate one dominant axis per Essay

1. AI workflow — Claude, ChatGPT, Cursor; Korea-relevant use cases.
2. Solo founders & creators — tools, templates, automation patterns.
3. Prompt engineering — patterns, case studies, anti-patterns.
4. B2B SaaS practice — payments, analytics, ops tools.
5. Founder/builder insight — decisions, frameworks, failures.
6. AI trend curation — weekly finds + Korea applicability.

**Do not overweight** 소상공인-only topics here; that ICP is **가게점수’s** channel. Elevate stays **generic professional** audience.

---

## Tone

- Practical, honest, natural Korean (and EN where posts are bilingual per pipeline).
- English technical terms OK (`prompt engineering`, `cash flow`, `PMF`, …).
- **No ad tone**; if it reads like agency sales, it failed.
- Not academic.
- Warm but competent; 1st person when natural.
- Prefer evidence-hedged claims over absolutes.

---

## Quality gates (before publish)

- ≥1 **actionable takeaway** stated.
- Prefer **sourced** examples / data when claiming external facts (web search or cited links).
- **Length:** announcement-style KO often **~800–1,200자**; longer essays **~1,000–2,500자** as appropriate.
- Headline: curiosity + clarity.
- **SEO:** 1–3 keywords woven naturally.
- **PostHog:** if the post has a primary CTA, tracking must follow [`docs/CONTENT_FUNNEL.md`](../docs/CONTENT_FUNNEL.md) / ADR-013 patterns (waitlist links already instrumented on marketing surfaces where applicable).
- **0%** advertorial for 가게점수.

---

## Studio Dispatch format (Thursdays)

- **Intro** — 2–3 sentences, founder voice.
- **Main essay** — one deep piece (best Essay of the week **or** Dispatch-only).
- **Curation** — 3–5 external links + one-line notes.
- **Founder note** — 1–2 short paragraphs (shipping, doubt, learnings).
- **CTA** — Essays / social / 가게점수 launch alert — **one light line** at the end.

Target **1,500–2,500 characters** (Korean newsletter norm); align outline on **Sunday** plan.

---

## Daily / weekly rhythms

### Daily (Mon / Wed / Fri publish days)

1. Morning — trend scan (X, HN, Anthropic/OpenAI blogs, Korean tech press).
2. AM — outline + draft for **that day’s** post.
3. PM — edit, publish, light social share.
4. Evening — PostHog spot-check + **next** post seed (one line in [`content-plan-weekly.md`](content-plan-weekly.md)).

### Weekly

- **Sunday evening** — next week’s 4–5 topics in `content-plan-weekly.md`.
- **Thursday** — Dispatch.
- **Friday** — weekly metrics roll-up (PV, email signup, open rate, CTR).

---

## Cursor session start (recommended order)

1. [`activeContext.md`](activeContext.md)
2. [`tasks.md`](tasks.md)
3. **`operations-mode-2026-q2.md`** (this file)
4. [`content-plan-weekly.md`](content-plan-weekly.md)
5. **Topic SoT:** [`docs/content-queue/topics/`](../docs/content-queue/topics/) (matches the day’s slot—e.g. Wed Essay brief)

Then: confirm today’s topic → outline → draft → gates → publish → note PostHog delta → seed next post.

---

## Source links (in-repo)

| Doc | Role |
|-----|------|
| [`creative-elevate-ai-pivot.md`](creative-elevate-ai-pivot.md) | North Star narrative (paused execution) |
| [`tasks.md`](tasks.md) | Task SoT |
| [`activeContext.md`](activeContext.md) | Current phase |
| [`content-plan-weekly.md`](content-plan-weekly.md) | Week plan |
| ADR-012, ADR-013, ADR-005 | Positioning, analytics, payments |

---

*Updates: bump “Effective” or add a one-line changelog when policy shifts.*

## Studio Brand Identity (added 2026-05-08)

Elevate는 Studio brand — vertical product 빌드하는 솔로 founder의
holding entity. 가게점수가 first vertical, future verticals 동일
framework. 콘텐츠는 Studio operations documentation 역할.

Reference: `docs/adr/ADR-014-elevate-studio-brand.md`.

### Voice 정밀화

- Old: "AI-augmented worker, pragmatic skepticism"
- New: "Solo founder running AI-augmented Studio. Practitioner
  documentation of multi-agent vertical building. Patterns discovered,
  anti-patterns avoided."

Implication: Essays voice가 "내가 일하는 방식 documenting" → "내가 운영하는
Studio가 어떻게 vertical product를 ship하는지 documenting"으로 shift. 같은
author, 더 specific lens.

### Topic axes 재조정

- (유지) AI workflow application — Studio 내부 운영 사례 강조
- (유지) Solo operator productivity — 1인 vertical 빌드 lens
- (유지) Prompt engineering — multi-agent orchestration 강조
- (재조정) Vertical product building — B2B SaaS 일반론 → 1인 vertical
  builder 관점
- (유지) Founder / builder insights — Studio operating learnings
- (유지) AI trend curation — Studio strategic perspective

### 가게점수 mention rule

자연 mention OK (Studio가 빌드 중인 product 중 하나로). 광고형 push X.

판단 기준:

- Natural mention: "이번 주 가게점수 V0.5 ship하면서 발견한 multi-agent
  orchestration pattern은…" → OK. 콘텐츠 가치 self-contained, 가게점수는
  example로 기능.
- Ad-style push: "가게점수, 1인 카페 사장님 마케팅 진단 도구입니다. 지금
  진단받기" → NOT OK. 콘텐츠가 promotion vehicle.

### Operating implication

Cursor의 daily 운영은 본 voice + topic axes를 reference. Cadence는 ADR-015로 update — Essays 1–2/week + Studio Dispatch Thursday 9 AM ET (NY time, DST-aware). 다음 3개 Essays에서 voice 정밀화 결과 평가 — unsubscribe rate · engagement 데이터 보고 W4 재조정.

---

## Content Products (per ADR-015)

Elevate Studio의 content output은 two distinct products로 구성. 두 product 모두 ADR-014 voice rules 3개 적용 + 6 topic axes 매핑.

### Essays (longform practitioner publication)

- **Length**: 1,500–2,500 words
- **Cadence**: 1–2 per week
- **Anchor**: Studio's own building에서 나온 concrete artifacts (decisions · architectures · trade-offs · outputs). Hypothetical · trend speculation 단독 essay 금지.
- **Reference canon mapping**: 각 essay outline 단계에서 1개 reference canon layer explicit 매핑:
  - **Stratechery** — analytical spine (industry / strategy lens)
  - **Lenny** — practitioner evidence (real artifacts + outcomes)
  - **Gawande** — procedural thesis (process가 thesis carrier)
- **Archive value**: Long-tail SEO + thesis-level credibility 누적. 6개월 후에도 referenceable 유지.
- **Topic axis mapping**: 6 topic axes 중 1개 primary + 1개 secondary (optional).
- **Distribution**: Self-hosted at Elevate domain. Founder personal social channels supplement. Hacker News submission은 thesis-level essays에 한정 selective.

### Studio Dispatch (weekly build report)

- **Length**: ~400–700 words
- **Cadence**: Every Thursday 9 AM ET (NY time, DST-aware). Lock된 schedule.
- **Anchor**: 한 주의 specific decision 또는 artifact 1개 — 그 reasoning · cost · open question 1개.
- **Tone**: Build documentation tone (ADR-014 voice rule 2). Polish over speed가 아닌 transparency over perfection.
- **Topic axis mapping**: 6 topic axes 중 그 주의 actual building에 most relevant 1개.
- **Distribution**: Email subscribers (Studio Dispatch list) + Elevate domain archive.

### Phase boundary (per ADR-015 sentence 8)

- **Phase 1 (current)**: Audience build primary. Monetization (paid tier · sponsorship · etc.)는 deferred.
- **Phase 2 trigger**: 30+ essays published *AND* ADR-014 Phase 2 trigger (3 verticals + $50K/month sustained 6 months) approached. 두 조건 모두 만족 시 reopen.

### Inaugural essay

"The 60-Minute Boardroom"을 inaugural essay로 reframe. Spec verify 후 publish — mismatch 시 retrofit 또는 rework forced choice.
