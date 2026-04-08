# gstack-style review — Studio Productions (Workbench) MVP

**Purpose:** This document reproduces the **intent and depth** of the gstack `/autoplan` pipeline (CEO → Design → Eng) for the **Studio Productions** feature. It is the review artifact for implementation.

**Outside voices:** Codex and a separate Claude subagent were **not** invoked in this session (tooling not guaranteed in this environment). Findings below are **primary reviewer** analysis with explicit **deferred verification** where an independent second voice would normally disagree-check. Re-run `/autoplan` locally if you want dual-voice logs and `gstack-review-log` entries.

**Related ADR:** [`docs/adr/ADR-003-studio-productions-mvp.md`](../adr/ADR-003-studio-productions-mvp.md)

---

## A. Intake — problem, premises, non-goals

### A.1 Problem statement

Operators (including founders dogfooding) need a **durable place inside Elevate** to record **channel deliverables** (for example one YouTube Short) and **linked artifacts**: prompts, tool-specific settings, external URLs (Runway, Kling, ChatGPT, Gemini), and notes. Today **Library** is bound to **catalog products and entitlements** (`content_products`, `organization_content_entitlements`). User-generated production assets do not belong in that model without corrupting the commercial semantics of Library.

### A.2 Premises (require human judgment — listed for approval)

| ID | Premise | Valid if |
|----|---------|----------|
| P1 | First dogfood workflow is **Runway → export → YouTube Short**, with metadata captured in Elevate. | You accept manual copy-paste of prompts and URLs in v1 (no Runway API). |
| P2 | Data is **organization-scoped**, same tenancy pattern as the rest of the dashboard. | Matches `profiles.organization_id` and existing RLS helpers. |
| P3 | **Library** stays catalog-only. New surface is a **separate nav item** and tables. | Avoids mixing ebook SKUs with UGC. |
| P4 | **Prompt Studio** integration in v1 is **navigation + deep link placeholder** or “open Studio with prefilled prompt” later, not a blocker for shipping the ledger. | ADR-002 still gates LLM improve API. |

### A.3 Explicit non-goals (v1)

- No OAuth or server-side integration with Runway, Kling, YouTube, or Gemini.
- No binary video storage in Supabase unless explicitly added in a later ADR (cost, retention, abuse).
- No replacing **audit_logs** for compliance. Optional **append-only** audit events may reference episode IDs later.
- No public pages for episodes. Dashboard only.

### A.4 Locked product consensus — v1 is not “integration”

**Agreed:** v1 does not need (and should not imply) productized **API integration** with Runway or other vendors.

**What v1 is instead:**

| Mechanism | Role |
|-----------|------|
| **Saved URLs** | `publish_url`, `external_url`: open in new tab. Proof and navigation only. |
| **Shortcuts** | Optional static links or buttons in the UI to common tools (same as bookmarks; no backend). |
| **Labels** | `tool_platform`, `artifact_role`, `distribution_label`: taxonomy for **sorting, filtering, and memory**, not capability flags. |

**UX copy:** It is enough to **list** what creators can use (“these tools work well with this workflow”) or to show **empty-state hints**. That sets expectations without promising automation.

---

## B. Phase 1 — CEO / strategy

### B.1 Premise challenge

- **P1** is the load-bearing premise. If expectations drift toward **vendor automation**, v1 will feel weak. The locked positioning (**A.4**) is: **ledger + links + labels**; shortcuts are bookmarks-level, not APIs. Dogfood is **copy URL from Runway, paste into Elevate**.
- **P3** vs merging into Library: merging would **reuse UI** but **confuse entitlements and empty states**. Separate surface wins for clarity. Cost: one more nav item and mental model to teach (“Library = what you bought, Productions = what you shipped”).

### B.2 What already exists (leverage map)

| Need | Existing code / pattern |
|------|-------------------------|
| Org-scoped RLS | `public.user_organization_id()`, patterns in `007_audit_logs.sql`, `008_toss_payment_intents.sql` |
| Dashboard shell, sidebar | `src/components/dashboard/sidebar.tsx`, `(dashboard)/dashboard/*` |
| i18n | `messages/*.json` Dashboard namespace |
| Auth | Supabase session in server components |

### B.3 Dream state (12-month, not this PR)

- Artifact **version history** and diff against Prompt Studio suggestions.
- Optional **file uploads** to org-scoped Storage with quotas.
- **PostHog** events with a **single enum** for production actions (per `.cursor/rules/posthog-integration.mdc`).
- Export **Markdown / JSON** for case studies.

### B.4 Alternatives (implementation)

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| A. New tables + dashboard routes | Clear domain, matches tenancy | New migration + UI | **Chosen** |
| B. Store JSON in `organizations.metadata` | No migration | No relational integrity, poor queries | Reject |
| C. Reuse `audit_logs` only | No new table | Wrong semantics, append-only pain for edits | Reject |

### B.5 Failure modes (product)

| Risk | Mitigation |
|------|------------|
| Users confuse Library vs Productions | Distinct labels, onboarding copy on first visit |
| Empty product if no org | Same as Library: require org or show CTA |
| Scope creep into “video CMS” | ADR non-goals, ship ledger first |

### B.6 CEO consensus table (dual voice — simulated)

| Dimension | Primary | Note |
|-----------|---------|------|
| Premises valid | Yes | P4 must stay explicit to avoid blocking on ADR-002 |
| Right problem | Yes | Library mismatch is real in code |
| Scope | Episodes + artifacts, no integrations | Deferred: Studio API, Storage |

**CEO phase finding:** No user-challenge to the user’s direction (separate stealth vs official channels is supported by optional `distribution_label` text field on episode, not a separate product).

---

## C. Phase 2 — Design / UX

### C.1 Scope

UI scope **detected**: new dashboard section, list + detail, forms, empty states, errors.

### C.2 Information hierarchy

1. **List:** Episodes reverse chronological. Columns: title, status, optional publish URL host, updated time.
2. **Detail:** Episode header + **artifacts** as ordered list (drag reorder later, v1 manual sort order integer).
3. **Primary action:** Create episode → Add artifact rows (platform, role, text, URL).

### C.3 States (must be specified for implementer)

| State | Behavior |
|-------|----------|
| Loading | Skeleton or spinner on list and detail |
| Empty org | Reuse pattern from other dashboard pages if any; else message: join org |
| Empty episodes | CTA “Create first episode” |
| Error load | Inline error + retry |
| Form validation | Title required; URL optional but must be valid URL if present; `content_text` max length bound (e.g. 32k) to match DB |

### C.4 Accessibility

- Buttons and links keyboard reachable.
- Heading order: h1 page, h2 sections.

### C.5 Design consensus (simulated)

| Dimension | Score / note |
|-----------|----------------|
| Hierarchy | Clear |
| Missing states | Specified above |
| Taste | Nav label: **“Productions”** EN / **“제작”** KO (or “콘텐츠 제작”) — pick one in i18n and stay consistent |

---

## D. Phase 3 — Engineering

### D.1 Architecture

```
profiles.organization_id
        │
        ▼
studio_production_episodes (organization_id)
        │
        └── studio_production_artifacts (episode_id)
```

- **RLS:** Episodes: select/insert/update/delete where `organization_id = user_organization_id()`. Artifacts: via **exists** subquery on parent episode org match, or duplicate `organization_id` on artifact for simpler policies (ADR picks one; duplicate org_id on artifact reduces join complexity for RLS).

**Recommendation:** Put `organization_id` on **both** tables. Denormalize on artifact insert from parent episode. Enforce with trigger or application layer. Simplifies RLS: same predicate on both tables.

### D.2 Security

- No user-supplied HTML rendered unsanitized (text areas plain).
- `metadata` jsonb: do not store secrets (API keys). Reject or strip known key patterns in API if you add server actions.

### D.3 Test plan (minimum)

| Layer | What |
|-------|------|
| Unit | Serialization / validation helpers for URLs and enums |
| Integration | Optional: RLS smoke if project adds Supabase test harness; else manual QA checklist in ADR |
| E2E | Optional later: create episode smoke |

### D.4 Eng consensus (simulated)

| Dimension | Assessment |
|-----------|--------------|
| Architecture | Straightforward FK + RLS |
| Performance | Index `(organization_id, updated_at desc)` on episodes |
| Migration | Forward-only `017_*.sql` |

### D.5 Test diagram (codepaths)

| Flow | Coverage |
|------|----------|
| List episodes for org | Server component + Supabase query |
| Create episode | Server action or POST handler + RLS insert |
| Add artifact | Insert child row |
| Cross-org access | Must return zero rows (manual QA or policy test) |

---

## E. Cross-phase themes

1. **Honest v1:** Ledger first, integrations later. Same theme in CEO and Eng.
2. **Denormalized org_id on artifacts** trades redundancy for simpler RLS. Eng and security align.

---

## F. Decision audit trail (autoplan-style)

| # | Phase | Decision | Principle | Rationale |
|---|-------|----------|-------------|-----------|
| 1 | CEO | Separate surface from Library | DRY domain | Catalog vs UGC |
| 2 | Eng | `organization_id` on artifacts | Explicit | RLS simplicity |
| 3 | Design | List → detail pattern | Completeness | Standard dashboard |
| 4 | CEO | No vendor API in v1; links + labels only | Pragmatic | Full integration unnecessary |

---

## G. Final gate — taste decisions for human

1. **Nav label:** “Productions” vs “Studio productions” vs Korean “제작” only in KO. **Recommendation:** EN **Productions**, KO **제작** (short).

2. **Episode status enum:** `draft | ready | published | archived` vs fewer. **Recommendation:** Four values for filters without overfitting.

3. **`tool_platform`:** Free text vs check constraint list. **Recommendation:** **Text** with **suggested values** in UI (runway, kling, gemini, chatgpt, other). Allows new tools without migration.

---

## H. Status (pre–dual-voice)

**VERDICT (primary reviewer):** **READY FOR PLAN → BUILD** — ADR-003 + migration + dashboard routes align with **A.4** (links, shortcuts, labels only).

**DONE_WITH_CONCERNS:** Sections marked **simulated** or **[single-reviewer]** are not replaced by Codex or a second Claude run until you execute **local `/autoplan`** (see § I).

---

## I. Local gstack `/autoplan` — what to run and what gets stronger

**When:** Before the first merge, or when you want **dual-voice consensus tables** and **`gstack-review-log`** entries on disk.

**Inputs:**

1. A **plan file** (Markdown) that contains at minimum: problem, v1 scope per **A.4**, ADR-003 pointer, affected routes. You can copy § A–D from this document into `docs/features/PLAN-studio-productions.md` if you want a single file for `/autoplan` to chew on.
2. Repo on a branch with **no uncommitted ADR drift** (or note drift in the plan).

**Steps (high level):**

1. From the project root, invoke gstack **`/autoplan`** against that plan file (see [`.agents/skills/gstack/autoplan/SKILL.md`](../../.agents/skills/gstack/autoplan/SKILL.md) for full behavior).
2. Let Phase 1–3 complete. **Premise gate** and **user challenges** still require your answers if triggered.
3. Check for **`## GSTACK REVIEW REPORT`** or review logs under `~/.gstack/projects/<slug>/` per your install.
4. Merge any **taste decisions** from the gate back into ADR-003 or this file.

**What improves relative to [single-reviewer]:**

- Codex + subagent **disagreement rows** in CEO / Design / Eng consensus tables.
- **Decision audit trail** rows you did not author manually.
- Optional **test plan artifact** path on disk (autoplan writes under `~/.gstack/projects/...` when Eng phase runs at full depth).

**If you skip `/autoplan`:** BUILD can still proceed from ADR-003 + this doc; you accept **single-reviewer risk** on strategy and edge cases.

---

## J. Incremental backlog (after v1 ships — PLAN-friendly slices)

Work items below are **ordered** so each slice is shippable without requiring vendor integration. Pick any row as a separate PLAN or BUILD ticket.

| Priority | Slice | Outcome |
|----------|--------|---------|
| J1 | **Migration + types** | `017_*.sql`, RLS, trigger, `pnpm db:types` |
| J2 | **List + create episode** | Org-scoped list, form, redirect to detail |
| J3 | **Artifacts CRUD** | Add / edit / delete rows; `sort_order`; validate URLs |
| J4 | **Help strip** | Static copy: suggested tools + “paste links only” (no API) |
| J5 | **PostHog** | One const enum; one event on create episode (optional) |
| J6 | **Prompt Studio handoff** | Button “Open Studio” → `/dashboard/studio?prompt=…` (encoding TBD), still no LLM until ADR-002 |
| J7 | **Export** | Markdown or JSON export per episode (case studies) |
| J8 | **Artifact versions** | Child table or `version` column (debate in PLAN) |
| J9 | **Storage** | Supabase Storage for thumbnails only; ADR addendum |

---

## K. Handoff — Cursor **Plan** mode (next step for you)

**Ready:** A.4 and ADR-003 are aligned. § J gives backlog ordering.

**Open in Plan mode with:**

- [`docs/adr/ADR-003-studio-productions-mvp.md`](../adr/ADR-003-studio-productions-mvp.md)
- [`docs/features/GSTACK_REVIEW-production-workbench.md`](GSTACK_REVIEW-production-workbench.md) (§ C–D for UI and RLS)
- Optional new file: `docs/features/PLAN-studio-productions.md` — one-page **BUILD plan** (migration number check, exact route path, i18n key list) if you want `/autoplan` to target a single artifact.

**Plan mode should decide:** Exact URL path (`/dashboard/productions` vs nested under `studio`), first-launch empty state copy (KO/EN), and whether J4 ships in the same PR as J1–J3.

**After Plan:** Agent mode BUILD → `pnpm verify` → merge.

---

## H2. Status (after local `/autoplan`, optional)

**VERDICT (to fill):** Re-run this section after `/autoplan` completes. Replace **DONE_WITH_CONCERNS** with **DONE** or list open items from the final gate.

**Suggested next command in dev environment:** implement migration and `pnpm verify` before merge.
