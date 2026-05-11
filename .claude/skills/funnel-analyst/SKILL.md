---
name: funnel-analyst
description: Conversion funnel friction diagnosis. Use when analyzing PostHog 4-event funnels for drop-off patterns, when hypothesizing friction causes ((a) UX / (b) value clarity / (c) audience mismatch / (d) trust gap per ADR-014 wedge mechanism), or when locking verification paths for friction hypothesis tests before instrumenting fixes.
allowed-tools: Read, Glob, Grep
---

# Funnel Analyst — Conversion Friction Diagnosis

## When to invoke

- PostHog funnel data shows drop-off at one of the 4 events and the cause isn't obvious.
- Conversion rate at a step diverges from expectation (e.g., signup → waitlist join, waitlist → paid).
- A friction hypothesis needs structured framing before instrumentation work.
- A user-facing change is proposed to fix friction and needs hypothesis + verification path documented.

## What to do

### 1. Identify the drop-off step

- Per ADR-013, marketing instrumentation tracks 4 events. Map drop-off to a specific event boundary.
- Reference: `docs/CONTENT_FUNNEL.md` for current event names and CTA patterns.

### 2. Apply 4 hypothesis lenses in order

- **(a) UX friction** — is there a usability issue (form length, button placement, page load, mobile vs desktop, error states, validation noise)?
- **(b) Value clarity** — does the user understand what they get and why it's worth the action (copy, pricing position, before/after, social proof visibility)?
- **(c) Audience mismatch** — is traffic landing here the wrong segment for this offer (acquisition source, intent, vertical, geo)?
- **(d) Trust gap (ADR-014 wedge mechanism)** — does the audience have a trust scar in this category that this product hasn't addressed (foreign brand, foreign currency, generic claims in a saturated category, missing local credibility signals)?

Apply in order; don't skip to (d) if (a)–(c) haven't been examined.

### 3. Hypothesis lock format

```
Hypothesis (a / b / c / d): <single sentence>
Evidence on hand: <PostHog data points, screen recordings, qualitative reports, or absence of data>
Verification path: <next instrumented event, A/B test, qualitative input, or observable signal that distinguishes this hypothesis from alternatives>
Decision trigger: <observation that would lock or kill this hypothesis>
```

### 4. Don't ship the fix yet

- Verification path comes before fix. ADR-013 instrumentation discipline.
- If multiple hypotheses are live, the verification path must distinguish between them, not validate one in isolation.

### 5. Trust gap pattern (ADR-014 wedge)

- Concrete example: ADR-017 codified KRW vertical-level payment localization because the audience trust scar (Korean self-employed reading USD price as "foreign / not for me") was a (d)-class friction.
- Pattern: when (a)/(b)/(c) don't explain drop-off in an audience with a known trust scar category, check (d) before adding more UX polish.

## References

- ADR-013 (marketing CTA + PostHog instrumentation — 4-event spec, funnel reporting)
- ADR-014 (trust gap wedge mechanism — Decision sentence 3, filter (d))
- ADR-017 (vertical payment localization — KRW friction as (d)-class trust gap example)
- `docs/CONTENT_FUNNEL.md` (CTA / funnel patterns reference)

## Out of scope

- Fix implementation (BUILD phase, after hypothesis verification)
- PostHog instrumentation engineering (separate ADR-013 BUILD work)
- A/B testing infrastructure setup
- New event design (separate analytics ADR)
