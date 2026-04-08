# Quality pipeline — design + engineering (gstack)

This document turns **harness files** (`AGENTS.md`, root `DESIGN.md`, `docs/design/SYSTEM.md`, tokens in `globals.css`) into a **repeatable review pipeline** by pairing them with **gstack** skills. It does not replace `pnpm verify` or commit hooks.

**Authority order** (unchanged): [`docs/AI_ORCHESTRATION.md`](../AI_ORCHESTRATION.md) — repo rules → memory-bank → gstack.

---

## 1. What “quality” means here

| Layer | Ensures |
|-------|---------|
| **Harness** | Same vocabulary (tokens, surfaces), discoverable `DESIGN.md`, alignment doc |
| **gstack (CTO / Eng)** | Architecture, edge cases, security/RLS awareness, test gaps — **before or after plan, before big merges** |
| **gstack (Designer)** | Plan-level UX coherence — **before build**; live polish — **after build** |
| **Repo** | `pnpm verify`, ESLint, no `--no-verify` |

---

## 2. Recommended sequence (UI or product-facing work)

```text
Ideation / scope  →  Design plan review  →  Eng plan review  →  BUILD  →  verify  →  (visual QA)  →  ship
     ↓                      ↓                      ↓
 optional            /plan-design-review    /plan-eng-review
 /plan-ceo-review
 /office-hours
```

1. **Scope & North Star** (optional): gstack **`/office-hours`** or **`/plan-ceo-review`** when direction or scope is unclear — capture outcomes in `memory-bank/tasks.md` / pivot doc.
2. **Designer lens (plan)**: gstack **`/plan-design-review`** when the change includes **new layouts, flows, or marketing surfaces**. Input: `docs/design/SYSTEM.md`, vendored `DESIGN.md`, `elevate-cursor-alignment.md`.
3. **CTO / engineering lens (plan)**: gstack **`/plan-eng-review`** to lock **data flow, auth/RLS, failure modes, performance, tests**. Output: ADR snippet, `tasks.md` bullets, or a short note in `memory-bank/activeContext.md`.
4. **BUILD**: Cursor **Agent** + repo rules; run **`pnpm verify`** before commit.
5. **Post-build visual pass** (if UI changed): gstack **`/design-review`** (polish in source) or **`/browse`** / **`/qa`** if installed — not a substitute for verify.
6. **Pre-merge**: gstack **`/review`** on the diff (security/SQL/LLM boundaries) — optional but recommended for risky changes.

---

## 3. Skill map (concise)

| Lens | gstack skill | When |
|------|----------------|------|
| **Product / scope** | `/plan-ceo-review`, `/office-hours` | Ambitious scope, wedge, narrative |
| **Designer (plan)** | `/plan-design-review` | UI/UX plan before implementation |
| **CTO / Eng (plan)** | `/plan-eng-review` | Architecture, edge cases, coverage |
| **Designer (live)** | `/design-review` | After implementation — visual consistency |
| **QA** | `/qa`, `/browse` | Dogfood flows, screenshots (if gstack setup) |
| **Diff safety** | `/review` | Before merge |

Live-site audits: see vendored **`.agents/skills/gstack/design-review/SKILL.md`** (gstack).

---

## 4. If gstack is not installed

- Use **Cursor Plan** twice: (1) UX / surface checklist using `SYSTEM.md` + alignment doc, (2) engineering checklist (RLS, errors, loading states, tests).
- Still run **`pnpm verify`**.

---

## 5. Persistence rule

Anything gstack decides that must survive the next session should be written to **`memory-bank/tasks.md`**, **`activeContext.md`**, or an **ADR** — not only in the chat transcript. See [`docs/GSTACK.md`](../GSTACK.md) and [`CLAUDE.md`](../../CLAUDE.md).
