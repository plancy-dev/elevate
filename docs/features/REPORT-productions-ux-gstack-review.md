# Productions (제작) UX review — gstack-style pipeline

**Date:** 2026-04-16  
**Scope:** `/dashboard/productions` hub, sub-routes (projects, channels, integrations), episode detail, data layer.  
**Method:** Structured pass inspired by gstack’s **CEO / Design / Eng** review lanes (see `.agents/skills/gstack/autoplan` — sequential critique: problem, scope, taste, risks, ship bar).

---

## 1. CEO / product lane

| Finding | Severity | Note |
|--------|----------|------|
| **Same word, two meanings** — “프로젝트” appeared as (a) queue filter and (b) peer tab next to “에피소드”, implying equal hierarchy. | High | Projects are **containers** (brand, persona, defaults); episodes are **work items**. They should not read as siblings without explanation. |
| **Unassigned episodes** — Org-wide episodes with `project_id = null` were not first-class in the queue UI. | Medium | Users need to triage “inbox” vs “under a brand”. |
| **Sub-routes** — Projects / channels / integrations share a shell; integrations is intentionally scaffold-heavy (v2 roadmap). | Low | Acceptable if copy sets expectations (already partly done). |

**Direction:** Make **queue scope** explicit (filter language + optional context strip), and make **project administration** visually distinct from **episode work** (nav grouping + renamed tab).

---

## 2. Design lane (SYSTEM.md / DASHBOARD_UX_PRINCIPLES)

| Principle | Before | After (implemented) |
|-----------|--------|---------------------|
| Short vertical **marker** on active sub-nav | Kept | Unchanged — still valid. |
| **One** list container, divide-y | Kept | Unchanged. |
| **Hierarchy** — title leads, status compact | Partial | Episode rows now show **project chip** or **“no project”** so scan matches mental model. |
| Avoid duplicate nav metaphors | Weak | **Work vs Studio setup** groups separate “에피소드 큐” from “프로젝트 설정 / 채널 / 연동”. |

---

## 3. Engineering lane

| Topic | Detail |
|-------|--------|
| **Data** | `listStudioEpisodesForOrg` embeds `studio_projects ( id, name )` for list labels. |
| **Filters** | `?project=none` filters `project_id IS NULL`; UUID filters that project; omit param = all (within channel filter). |
| **Counts** | Unassigned count = `total - sum(per-project counts)` with same channel scope. |
| **Cross-filter** | Channel `<select>` preserves `project` query including `none`. |

**Risks:** Magic string `none` is reserved — documented as `PROJECT_QUERY_UNASSIGNED` in code.

---

## 4. Ship checklist (this iteration)

- [x] Queue scope label: **“에피소드 표시 범위”** / **Queue scope** (not generic “Project”).
- [x] Dropdown: **전체 / 미지정 / 각 프로젝트**.
- [x] Context **banner** when scoped to unassigned or a specific project.
- [x] Episode rows: project name or **미지정**.
- [x] Segmented nav: **작업** (에피소드) vs **스튜디오** (프로젝트 설정, 채널, 연동).
- [x] Tab copy: **프로젝트 설정** (was ambiguous “프로젝트”).

---

## 5. Anti-“AI template” polish (design review pass)

| Pattern (avoid) | Replacement |
|-----------------|-------------|
| Decorative **blue gradients** on dashboard headers and form shells | **Flat** `bg-layer-01` + `border-border-subtle` (`VISUAL_LANGUAGE` depth budget) |
| **Sparkles** icon for generic “magic” | **LayoutList** — reads as instrumentation, not marketing |
| **Film-strip** repeating-linear-gradient bar | Removed — noise without information |
| **Uppercase micro-labels** in segmented nav (duplicate SaaS trope) | **Screen-reader only** group labels; visual grouping = **divider + wrap** |
| **Primary-tinted banner wash** for project scope | **Left accent bar** (`border-l-primary`) + neutral surface |
| Oversized **rounded-2xl** + stacked shadows on every form block | **`rounded-xl`**, single border, no gradient fill |

---

## 6. Follow-ups (not in this PR)

- **New episode** deep-link with `?project=` when queue is project-scoped (form must read param).
- **Episode detail** breadcrumb showing project + link to project settings.
- **Empty state** copy when `project=none` and count 0 vs global empty.

---

## References

- `docs/design/DASHBOARD_UX_PRINCIPLES.md`
- `docs/design/SYSTEM.md`
- `DESIGN.md` (discovery entry)
