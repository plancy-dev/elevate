---
name: gagejumsu-vertical
description: 가게점수 vertical product decision support. Use when making decisions specific to 가게점수 (Korean self-employed marketing diagnosis AI for 카페·디저트·베이커리 owners), when applying ADR-017 vertical payment localization (KRW ₩9,900 via Polar.sh), when planning Stage 1/2/3 beta cohort progression (free → ₩1,990 → ₩9,900 per Dispatch #1), or detecting reverse-routing triggers where 가게점수 work surfaces Elevate Studio-level decisions.
allowed-tools: Read, Glob, Grep
---

# 가게점수 Vertical — Product Decision Support

## When to invoke

- A 가게점수 product decision is being made (audience, pricing, feature scope, cohort).
- A 가게점수 spec drift is observed (plan vs ship delta) and needs categorization (drift / scope reduction / scope addition with rationale).
- Beta cohort progression decision (Stage 1 / 2 / 3) needs framing.
- 가게점수 work surfaces a pattern that may apply to Elevate Studio-level decisions (reverse routing).

## What to do

### Audience lock

- **Primary**: 1인 카페 · 디저트 · 베이커리 사장님 (Korean solo café / dessert / bakery owners).
- **Trust scars**: ADR-014 filter (d) applies — foreign currency, foreign brand, generic claims, missing local credibility signals are friction sources.
- **Channel**: gagejumsu has separate repo + own domain (per ADR-014 boundary). **No code import to / from Elevate.**

### Payment + currency (ADR-017)

- **₩9,900** production price via **Polar.sh**.
- KRW vertical-level override of ADR-005 USD default — *vertical scope only*, Studio-level lock unchanged.
- Refund SOP follows Polar.sh + 한국 소비자 보호법.
- Tax: 한국 VAT + 통신판매업 신고 (가게점수 측 책임, vertical local jurisdiction).
- No other currency option for this vertical.

### Stage 1/2/3 beta cohort (Option E per Dispatch #1)

- **Stage 1 — first 5 free** — test: does the product land at zero friction (does diagnosis-as-product framing land).
- **Stage 2 — next 5 at ₩1,990** — test: does pricing land at low friction.
- **Stage 3 — production at ₩9,900** — test: does diagnosis-as-product framing convert at full price.
- **Branch point** (scenario A continue vs scenario D kill/pivot) closes when Stage 2 lands.
- **Invite mechanism**: Instagram DM invite codes. No public signup during Stage 1/2.
- The math says continue. Conversion at each stage says what the math cannot.

### Reverse routing detection

When 가게점수 work surfaces a pattern that applies beyond the vertical, route to `control-tower` for Elevate Studio-level surface:

| Vertical observation | Elevate-level pattern | Route to |
|---|---|---|
| KRW payment exception | Vertical payment localization framework | ADR-017 (already codified) |
| Plan-vs-ship spec rotation (12 added back to 10 cut) | Articulation-pressure mechanism rotates in build phase | Essay candidate (Dispatch #1 surfaced, future Essay) |
| Trust gap concrete manifestation | ADR-014 filter (d) wedge mechanism evidence | ADR-014 reference invocation |
| Cross-vertical pattern (when 2nd vertical exists) | Studio framework codification | New ADR via `strategic-architect` |

### Elevate-side mention rule

- **Natural mention OK** — when 가게점수 work is the example for a builder-facing insight (mechanism, anti-pattern, cost). Content value must be self-contained; 가게점수 is the case, not the pitch.
- **Ad-style push NOT OK** — pricing, signup, demo CTAs belong on 가게점수's own channels (per ADR-014 boundary).
- **One post-launch glass announcement OK** — Dispatch #1 already executed this beat. After that, light mentions only.

## References

- ADR-014 (Studio brand + Vertical boundary rules + filter (d) trust gap wedge)
- ADR-017 (Vertical payment localization — KRW exception codified, ADR-005 partial supersession)
- ADR-005 (Studio-level USD default — unchanged at Studio level)
- `content/dispatches/0001-from-boardroom-to-production.md` (Stage 1/2/3 spec, plan-vs-ship rotation mechanism, Polar.sh KRW production)
- `memory-bank/operations-mode-2026-q2.md` § Elevate vs 가게점수 (boundary), § Rules

## Boundary notes

- This skill operates on **Elevate-side awareness** of 가게점수 — decisions about how Elevate represents / mentions / relates to the vertical. It does **NOT** implement 가게점수 product features.
- 가게점수 work happens in a separate repo + separate Cursor agent. Do not attempt implementation in this codebase.
- Reverse routing is the primary value: catching when vertical observations should rise to Studio-level codification.

## Out of scope

- 가게점수 code implementation (separate repo)
- 가게점수-only marketing pages on elevate.ai.kr (ADR-014 boundary violation)
- Pricing detail / demo content on Elevate (가게점수 own channels)
- 가게점수 strategy beyond Stage 1/2/3 branch point (founder + 가게점수 session scope)
