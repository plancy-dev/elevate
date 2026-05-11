---
name: essay-writer
description: Longform Essay (practitioner publication) drafting per ADR-015. Use when writing an Essay (1,500-2,500 words) anchored in concrete Studio building artifacts, when reference canon mapping (Stratechery analytical spine / Lenny practitioner evidence / Gawande procedural thesis) needs explicit attachment at outline stage, when applying Pulitzer feature/narrative techniques to longform drafts, or when reviewing an Essay against ADR-015 spec for publish readiness.
allowed-tools: Read, Glob, Grep, Edit, Write
---

# Essay Writer — Longform Practitioner Publication

## When to invoke

- Drafting a new Essay (Elevate Studio's longform product per ADR-015).
- Reviewing an Essay outline against product spec (reference canon mapping, anchor verification).
- Reviewing an Essay draft for publish readiness (word count, voice, anchor strength).
- Reframing existing content (e.g., older blog post) as Essay product.

## What to do

### Outline phase (mandatory before drafting)

1. **Anchor** — identify the concrete artifact from Studio's own building this Essay rests on (decision, architecture, trade-off, output, session). Hypothetical / trend speculation alone disqualifies per ADR-015 spec.
2. **Reference canon mapping (mandatory, 1 of 3 explicit at outline stage)**:
   - **Stratechery** — analytical spine (industry / strategy lens). Use when the Essay's thesis is about a market structure or strategic choice.
   - **Lenny** — practitioner evidence (real artifacts + outcomes). Use when the Essay shows what was built and what happened.
   - **Gawande** — procedural thesis (process as thesis carrier). Use when the procedure / format / mechanism is the point, not the topic itself.
3. **Topic axis** — 1 primary (from 6 axes in `memory-bank/operations-mode-2026-q2.md`) + 1 secondary (optional).
4. **Word count target** — 1,500–2,500. Plan for it at outline; don't over-write expecting to cut.
5. **Outline review = quality gate** — per ADR-015 Cowork instruction reflection, outline missing reference canon mapping = publish reject. Resolve at outline, not in draft.

### Draft phase

1. **Voice (ADR-014 lock)** — founder-led narrative (founder is first noun, Studio is adjective), build documentation tone, vertical-specific naming.
2. **Pulitzer feature / narrative techniques (6, founder-locked)**:
   - **장면 진입** — open with a scene, not a premise statement. Reader enters the world before the argument arrives.
   - **한 사람으로 보편** — ground universal claims in one person / one moment. Specific over abstract.
   - **정보 계단식** — disclose information progressively. Don't dump context; lay it as the reader needs each piece.
   - **검증 가능한 사실** — names, numbers, dates over generalizations. Verifiable beats vivid when in tension.
   - **자기 연민 회피** — avoid self-pity register. Mechanism over personal struggle. The piece is about what worked or didn't, not about how hard it was.
   - **원형 종결** — closing echoes the opening with reframe. Reader feels the loop close.
3. **9 카피 원칙** — founder/CT session SoT. **Not yet codified in-repo.** If invoked, request founder paste the principle list before applying. **Do not invent principles.**

### Publish readiness check

- ☐ Anchor: concrete Studio-building artifact named.
- ☐ Reference canon: 1 of 3 layers attached at outline, visible in draft.
- ☐ Word count: 1,500–2,500.
- ☐ Voice: ADR-014 rules applied (founder is first noun, build documentation tone, vertical-specific naming).
- ☐ 6 narrative techniques: all 6 visible in draft (or 자기 연민 회피 by passive absence).
- ☐ Topic axis: 1 primary mapped.

### File path convention

- `content/essays/{kebab-case-slug}.md` (per ADR-015 Information Architecture — Essays not Blog).
- Note: as of repo state, inaugural Essay still at `content/blog/en/the-60-minute-boardroom.mdx`. Move to `content/essays/` pending Step 2 essay reframe verify.

## References

- ADR-015 (Essay product spec — length, cadence, anchor, reference canon)
- ADR-014 (voice rules)
- `memory-bank/operations-mode-2026-q2.md` § Content Products (per ADR-015), § Content topic axes (Essays)
- `content/blog/en/the-60-minute-boardroom.mdx` (inaugural Essay reference quality benchmark — Gawande procedural layer, 장면 진입 opening "Seven personas. Sixty minutes.", 검증 가능한 사실 throughout, 원형 종결 ending)

## Out of scope

- Weekly Dispatch writing (use `dispatch-writer`)
- Strategic decision-making behind the Essay (use `control-tower`)
- Publish path / commit (use `code-reviewer`)
- 9 카피 원칙 application without founder paste of principle list (don't invent)
