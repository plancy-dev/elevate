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
2. **퓰리처 피처/내러티브 작법 6개** (founder-locked):

   1. 장면 진입 — 추상 명제가 아닌 구체 장면으로 시작.
   2. 한 사람으로 보편 비추기 — 통계·전체보다 한 인물의 디테일이 보편 진실 carrier.
   3. 정보의 계단식 노출 — 한꺼번에 다 보여주지 말고 페이지가 내려갈수록 심층 정보 unfold.
   4. 검증 가능한 사실 — fabricated quote 또는 통계 금지. 검증 불가능한 진술은 명시.
   5. 자기 연민 회피 — 화자가 자기 동정에 빠지면 독자가 멀어진다. 객관 거리 유지.
   6. 원형 종결 — 첫 단락의 요소가 마지막 단락에서 다시 호응. 페이지가 닫힘.

3. **9 카피 원칙** (영문·한글 자료 종합, founder-locked):

   1. 진정성과 검증 가능한 사실 — 가짜는 멀리서도 들킨다. 과장된 약속, 만들어낸 사례 금지. 투명성과 정직이 심리 전술보다 우선.
   2. 독자 입장 — "I, us, we" 사고 회피. 자기 제품 자랑에서 떠나 독자에게 무엇이 남는지를 본다. 제품 쓸 사람 입장에서 실제로 할 법한 생각.
   3. 페르소나 한 명에 집중 — 셋·다섯을 동시에 노리면 메시지 희석. 메시지를 좁힐수록 그 메시지를 들어야 할 사람에게 더 정확히 도달.
   4. 통증을 뾰족한 언어로 — 잠재 고객의 문제를 뾰족하고 구체적인 언어로. 일반 명제 X, 구체 메커니즘 O.
   5. "마지못한 영웅" 서사 구조 — 문제 만난 사람이 해결책 개발, 이제 독자도 그 해결책을 살 기회. 월스트리트 저널 "두 청년 이야기" 공식.
   6. 숫자는 맥락과 함께 — 숫자만 던지지 말고 그 숫자가 무엇을 의미하는지 풀어야 한다.
   7. 함축과 간결의 줄타기 — 간결할수록 함축 부담 ↑. 길게 쓸 만한 가치를 매 단락이 갖고 있어야 한다.
   8. 반대 의견·이의제기 정면 응대 — 독자가 가질 만한 어려운 질문을 회피하지 말고 정면에서 다뤄라.
   9. 서사 구조가 페이지를 끌고 내려간다 — 위에서 아래로 자연스럽게 읽어 내려가도록 단락 간 논리적 흐름.

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
