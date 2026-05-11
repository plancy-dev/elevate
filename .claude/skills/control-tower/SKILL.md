---
name: control-tower
description: Cross-session synthesis and routing. Use when consolidating outputs from multiple Claude sessions, when implicit assumptions in a decision need articulation pressure, when a strategic decision needs risk and counter-argument framing, when Marc-dissent perspective (Pieter Levels archetype, scope-reduction obsession) would catch unexamined optimism, or when decisions need lock formatting for downstream sessions to consume.
allowed-tools: Read, Glob, Grep
---

# Control Tower — Cross-Session Synthesis and Routing

## When to invoke

- Multiple Claude session outputs (Code / 전략기획 / Cowork / others) need pattern surfacing or conflict reconciliation.
- A decision is approaching commit but rests on implicit assumptions that haven't been articulated.
- A founder request lacks counter-argument framing (one-sided thesis).
- The Pieter Levels archetype / Marc-dissent perspective hasn't been applied (scope reduction, indie hacker pragmatism, what-could-this-cut viewpoint).
- A decision needs lock formatting (next-session-readable summary) before fanning out work to other sessions.

## What to do

1. **Articulation pressure** — for each implicit assumption in the decision: ask the founder what user / what date / what evidence would change behavior. Cut what can't be answered concretely. Mechanism documented in `content/blog/en/the-60-minute-boardroom.mdx`.
2. **Marc-dissent injection** — frame the indie hacker / scope-reduction view of the decision. What gets cut. What's over-engineered. What ships in half the time at 80% spec. Persona reference: *Indie hacker advisor, Pieter Levels archetype, brutally pragmatic, scope reduction obsession.*
3. **Risk acknowledgment** — surface 2-3 risks that, if materialized, would invalidate the decision. Format:
   - Risk: <statement>
   - Trigger: <observable signal>
   - Mitigation: <action or explicit accept>
4. **Decision lock format** (once decision settles):
   - Decision sentence (single sentence, imperative).
   - Why (1-2 sentences, mechanism not narrative).
   - Risks acknowledged (bulleted, format above).
   - Next-session triggers (which downstream session does what next).
5. **Cross-session routing** — name explicitly which session handles each next step (Code commits, 전략기획 drafts ADR, Cowork publishes content, gagejumsu-vertical scopes vertical decisions).

## References

- ADR-014 (Studio brand + voice rules + 보드룸 Marc-dissent context)
- ADR-015 (Essays + Dispatch product design — articulation pressure mechanism codified)
- `content/blog/en/the-60-minute-boardroom.mdx` (articulation pressure mechanism explained, Gawande procedural reference, 보드룸 session as case study)
- `memory-bank/operations-mode-2026-q2.md` (Studio operations SoT)

## Out of scope

- ADR drafting itself (use `strategic-architect`)
- Essay or Dispatch writing (use `essay-writer` / `dispatch-writer`)
- Code commits (use `code-reviewer`)
- 가게점수-specific decisions (use `gagejumsu-vertical`)
