---
name: strategic-architect
description: ADR drafting and review. Use when creating a new ADR (Architecture Decision Record), when an existing de facto decision needs post-hoc codification, when supersession targets need detection (which prior ADRs does this replace or override), when Path A/B/C trade-off analysis is needed before lock, or when cross-ADR references need verification before commit.
allowed-tools: Read, Glob, Grep, Edit, Write
---

# Strategic Architect — ADR Drafting

## When to invoke

- A new strategic decision (technology, product, brand, payment, content, infra) needs codification.
- A de facto decision has been adopted (e.g., shipped in production) and needs post-hoc ADR.
- An existing ADR needs supersession or amendment.
- A decision requires Path A vs B vs C trade-off analysis.
- Cross-ADR references need verification (which ADRs does this invoke; which does it supersede).

## What to do

### Format lock — 8-section ADR template

1. **Status** — `Proposed (Draft)` / `Proposed (Stub)` / `Accepted` / `Superseded by ADR-XXX`. Include date.
2. **Context** — the problem this ADR answers. Surface what's currently implicit. End with the gap this ADR closes.
3. **Decision** — numbered sentences. Each sentence atomic and testable. No "and/or" hedging.
4. **Consequences** — sub-sections as relevant: Documents / Operations / Schema / Risks Acknowledged.
5. **Alternatives Considered** — minimum 3 paths (A / B / C). Each with Pros / Cons / Reject reason (or Accept reason for selected). Selected path marked `*(selected)*`.
6. **References** — existing ADRs, external sources, internal memory-bank files cited.
7. **Decision log** — dated entries showing how the decision evolved.

### Supersession detection

- Search `docs/adr/` for ADRs covering overlapping scope.
- For each overlap, decide: replaces / amends / coexists.
- Sentence pattern (if vertical override of Studio-level lock): "ADR-XXX (topic) — supersedes for vertical scope only; Studio-level lock unchanged."
- Reference the superseded ADR explicitly in Status (if full supersession) or in Decision (if partial).

### Cross-ADR reference verification

- Every ADR-XXX number cited must exist in `docs/adr/` *or* be flagged as `(forthcoming)` / `(stub-pending-land)`.
- Forward references that don't yet exist = dangling references; avoid in commit messages (mutable text only).
- Verify ADR file slug matches reference (e.g., `ADR-017-vertical-payment-localization.md` matches "ADR-017: Vertical Payment Localization").

### De facto codification (post-hoc)

- For decisions already shipped, Status flow: `Proposed (Draft) → Accepted` immediate transition.
- Decision log entry naming production reality as trigger.
- Reject Path C "Status quo / rollback" with concrete rollback cost argument (user-facing breakage, audience friction).

### File path convention

- `docs/adr/ADR-{NNN}-{kebab-case-slug}.md`
- Sequential numbering, no gaps even if a number is reserved/skipped (mark with stub or note in `README.md`).

## References

- Existing ADR exemplars:
  - `docs/adr/ADR-014-elevate-studio-brand.md` (brand identity, Alternatives 3-path)
  - `docs/adr/ADR-015-elevate-content-product-design.md` (product design, 8-sentence Decision)
  - `docs/adr/ADR-016-content-infra-redesign.md` (stub pattern, partial deliverable)
  - `docs/adr/ADR-017-vertical-payment-localization.md` (post-hoc codification, partial supersession)
- `docs/adr/README.md` (ADR index if exists)
- `docs/proposals/` (proposal docs that may precede ADR commit)

## Out of scope

- Strategic decision-making content itself (use `control-tower` for synthesis + articulation pressure)
- Code implementation of ADR consequences (BUILD phase, separate sessions)
- ADR publication / commit (use `code-reviewer`)
