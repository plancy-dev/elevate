---
name: dispatch-writer
description: Studio Dispatch (weekly build report, 400-700 words) drafting per ADR-015. Use when preparing the Thursday 9 AM ET (DST-aware) Dispatch issue, when applying the 4-beat structure (production reality / boardroom-vs-shipped delta / decision rationale / forward question), or when reviewing Dispatch draft against ADR-014 voice + Marc-dissent register for transparency-over-perfection tone.
allowed-tools: Read, Glob, Grep, Edit, Write
---

# Dispatch Writer — Weekly Studio Dispatch

## When to invoke

- Drafting this week's Dispatch (Thursday 9 AM ET publish slot).
- Reviewing Dispatch outline or draft against ADR-015 spec.
- Adapting a build observation (decision, artifact, cost) into Dispatch format.

## What to do

### Outline phase

1. **One artifact, one week** — pick a single decision or artifact from this week's actual building. Multi-topic Dispatches dilute the build documentation purpose.
2. **4-beat structure** (each beat advances the reader):
   - **Production reality** — what shipped, with concrete numbers (counts, prices, dates, model versions, processor names).
   - **Boardroom-vs-shipped delta** — where plan ≠ ship. Name the specific deltas (count, mechanism, currency).
   - **Decision rationale** — why the delta. Mechanism, not justification narrative. Reference articulation-pressure mechanism if relevant (see `content/blog/en/the-60-minute-boardroom.mdx`).
   - **Forward question** — one open question this raises for the next stage / cycle. Reader leaves with the question, not a conclusion.
3. **Word count target** — 400–700. Tighter than Essays. Cut explanatory padding.

### Draft phase

1. **Voice (ADR-014 lock + transparency-over-perfection tone)** — founder-led, build documentation, vertical-specific naming.
2. **Marc-dissent register** — scope-reduction pragmatism. What got cut. What didn't make the ship. (See `control-tower` skill for Marc archetype context.)
3. **Specifics over abstractions** — name attributes, prices, processors, model versions. "AI scoring via Claude sonnet-4-6" not "AI scoring."
4. **No retroactive narrative smoothing** — if the plan was wrong, say so; if a cut was added back, say why. The Dispatch documents reality, not founder positioning.

### Cadence lock

- **Thursday 9 AM ET (NY time, DST-aware)** — cron handles DST shift in handler logic (per ADR-016 stub Decision 4: Vercel Thursday 13:00 UTC year-round + handler-internal `America/New_York` timezone hour check).
- Hourly Essay publishing is a separate cron.

### File path convention

- `content/dispatches/{NNNN}-{kebab-case-slug}.md` — 4-digit zero-padded sequence.
- Frontmatter: `title`, `description`, `date`, `issue` (number), `publication: "Studio Dispatch"`, `tags`.

## References

- ADR-015 (Dispatch product spec — length, cadence, anchor, voice rule mapping)
- ADR-014 (voice rules — Marc-dissent register from 보드룸 context)
- ADR-016 (cron schedule + DST handling per stub Decision 4)
- `memory-bank/operations-mode-2026-q2.md` § Studio Dispatch format (Thursdays), § Content Products (per ADR-015)
- `content/dispatches/0001-from-boardroom-to-production.md` (inaugural Dispatch — 4-beat structure visible, Marc-dissent register, specifics over abstractions, plan-vs-ship rotation mechanism)

## Out of scope

- Longform Essay writing (use `essay-writer`)
- Cron / scheduling implementation (Phase 2 infrastructure per ADR-016)
- Email send pipeline (Phase 2 commission)
- Subscriber list management (Phase 2)
