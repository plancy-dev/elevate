# PLAN Draft — Agentic Content Quality Packs

## Goal

Define a replaceable quality system for newsletter/blog generation so operators can tune content quality by swapping prompt/template packs in code.

## Pack Model

### 1) Topic Strategy Pack

Fields:

- `audience_segment` (operator, team lead, founder, etc.)
- `problem_space` (automation reliability, cost, velocity, governance)
- `curiosity_hook_patterns` (question, contrarian, benchmark, teardown)
- `disallowed_topics` (off-brand or low-trust themes)

### 2) Generation Prompt Pack

Fields:

- `content_type`: `newsletter` | `blog`
- `format_contract` (required sections/headings)
- `tone_contract` (clarity, specificity, confidence)
- `evidence_contract` (min source references, no unsupported claims)
- `engagement_contract` (must include contrast/example/checklist/action)
- `cta_contract` (product-aligned and locale-safe)

### 3) Template Pack

Fields:

- locale framing copy (intro/bridge/cta)
- brand-safe phrasing variants
- section labels and fallback copy

Current base anchor:

- `src/lib/content-ops/locale-template-config.ts`

## Resolution Policy

- `activePackVersion` keys resolve generation behavior.
- priority:
  1) explicit run override
  2) default active version
  3) stable fallback version
- always persist `pack_version` in metadata for audit.

## Minimal File Layout (proposal)

- `src/lib/content-ops/packs/topic-strategy-pack.ts`
- `src/lib/content-ops/packs/newsletter-prompt-pack.ts`
- `src/lib/content-ops/packs/blog-prompt-pack.ts`
- `src/lib/content-ops/packs/pack-registry.ts`

## Quality Rubric (v1)

Score each draft 0-5 on:

1. **Relevance**: does it match target operator pain now?
2. **Novelty**: does it add non-obvious value?
3. **Specificity**: concrete examples/steps vs generic statements
4. **Evidence**: source-grounded claims and links
5. **Actionability**: clear next action for reader

Policy:

- `< 12/25`: force `review_required` with reason tags
- `12-18`: manual review required
- `>= 19`: eligible for approval queue

## Run Integration

During `draft_generate`:

- resolve active topic + prompt + template packs
- generate body with structure contract
- write `metadata.generation.pack_version` and rubric hints

During `review_gate`:

- evaluate rubric + hard checks
- write `metadata.review_gate.latest.quality_score`

## Operational Tuning Loop

Weekly:

- inspect top performing topics by open/click/reply proxy
- inspect low-performing drafts and map failed rubric dimensions
- release next pack version (`vX.Y.Z`) and keep rollback path

## Non-goals (this plan draft)

- model fine-tuning infrastructure
- personalization by individual subscriber profile
- external GUI prompt editor
