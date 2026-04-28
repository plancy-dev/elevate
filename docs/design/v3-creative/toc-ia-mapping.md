# CREATIVE — TOC IA mapping (Editor's Desk v3)

**Status:** Locked (2026-04-27 — re-locked from the 04-24 attempt; option choice unchanged)
**Option:** **A — Editorial metaphor** (selected over B/C after PLAN review)
**Consumed by:** S2 Shell build — [`src/components/desk/TOC.tsx`](../../../src/components/desk/TOC.tsx) (to be created)
**Related:** [`INIT-editors-desk-design-system.md`](../../features/INIT-editors-desk-design-system.md) · [`ADR-011`](../../adr/ADR-011-design-system-v3-editors-desk.md) · [`PLAN-editors-desk-s0-s1-s2.md`](../../features/PLAN-editors-desk-s0-s1-s2.md) § S2

---

## 1. The five sections

```
I.   Studio    - where you compose
II.  Scripts   - where you refine prompts
III. Library   - where finished work lives
IV.  House     - your organization
V.   Settings  - the margins
```

Display: `<h2 className="font-display text-[24px] leading-none">I. Studio</h2>` (Fraunces, opsz interpolated at ~24, still readable). Sub-items below in `font-body text-[13px] uppercase tracking-[0.08em] text-ink-500`.

Active sub-item: vermilion `•` bullet at left, weight stepped 400 → 500, color `text-ink-900`. **No background wash. No pill. No border radius.**

---

## 2. Route mapping

### I. Studio

The creator's workshop. Gravity of the product sits here.

| Sub-item | Route | Active match | i18n key (S2 introduces) |
|---|---|---|---|
| Productions | `/dashboard/productions` | `pathname === "/dashboard/productions" \|\| pathname.startsWith("/dashboard/productions/")` excluding the three sub-routes below | `Dashboard.toc.studio.productions` |
| Projects | `/dashboard/productions/projects` | `startsWith("/dashboard/productions/projects")` | `Dashboard.toc.studio.projects` |
| Integrations | `/dashboard/productions/integrations` | `startsWith("/dashboard/productions/integrations")` | `Dashboard.toc.studio.integrations` |
| Channels | `/dashboard/productions/channels` | `startsWith("/dashboard/productions/channels")` | `Dashboard.toc.studio.channels` |

Notes:
- `/dashboard/productions/new`, `/dashboard/productions/[episodeId]`, `/dashboard/productions/[episodeId]/editor` (Studio Phase 2 fullscreen editor) → active = **Productions** sub-item.
- When multiple sub-items match by prefix, **most specific prefix wins** (Projects/Integrations/Channels before Productions). Same resolution order as today's [`src/components/dashboard/sidebar.tsx`](../../../src/components/dashboard/sidebar.tsx) `isOrgNavItemActive`.

### II. Scripts

Prompt tooling — the writing instruments of the Desk.

| Sub-item | Route | Active match | i18n key |
|---|---|---|---|
| Prompt Studio | `/dashboard/studio` | `startsWith("/dashboard/studio")` | `Dashboard.toc.scripts.promptStudio` |

Only one sub-item at MVP. Future prompt-level tools (variants, evaluators, benchmarks) nest here, not under Studio.

### III. Library

The archive. Finished content, purchased assets.

| Sub-item | Route | Active match | i18n key |
|---|---|---|---|
| Library | `/dashboard/library` | `startsWith("/dashboard/library")` | `Dashboard.toc.library.library` |

Library detail pages (`/dashboard/library/[slug]`) keep the Library sub-item active.

### IV. House

The firm — people and governance.

| Sub-item | Route | Active match | Role gate | i18n key |
|---|---|---|---|---|
| Team | `/dashboard/team` | `startsWith("/dashboard/team")` | member+ | `Dashboard.toc.house.team` |
| Organization | `/dashboard/organization` | `pathname === "/dashboard/organization"` | org_admin+ | `Dashboard.toc.house.organization` |
| Audit | `/dashboard/organization/audit` | `startsWith("/dashboard/organization/audit")` | org_admin+ | `Dashboard.toc.house.audit` |
| Admin | `/dashboard/admin` | `startsWith("/dashboard/admin")` | global admin (`profiles.role === 'admin'`) | `Dashboard.toc.house.admin` |

Notes:
- Legacy `/dashboard/audit` (if rendering anything) redirects to `/dashboard/organization/audit` — no separate TOC entry.
- Admin sub-item is **hidden** for non-admins (server-rendered TOC checks role once and passes the filtered list to the client).
- Organization hub (`showOrganizationHub` in current sidebar) is replaced by House entirely.

### V. Settings

The margins of the page — preferences and help.

| Sub-item | Route | Active match | i18n key |
|---|---|---|---|
| Profile | `/dashboard/settings` | `startsWith("/dashboard/settings")` | `Dashboard.toc.settings.profile` |
| Billing | `/dashboard/billing` | `startsWith("/dashboard/billing")` | `Dashboard.toc.settings.billing` |
| Help | `/dashboard/help` | `startsWith("/dashboard/help")` | `Dashboard.toc.settings.help` |

Notes:
- Billing sits in **V. Settings**, not **IV. House**. Rationale: from the individual creator's perspective, billing is a personal setting (card on file, invoices). Organization-level billing roles are still gated server-side.
- Purchases (`/dashboard/billing/purchases`) → active = Billing sub-item.

---

## 3. Active-match resolution order

A single pass over the route table, **longest prefix wins**:

```ts
function activeSubItem(pathname: string, sections: TocSection[]): SubItem | null {
  let best: { item: SubItem; score: number } | null = null;
  for (const section of sections) {
    for (const item of section.items) {
      if (pathname === item.href) return item;
      if (pathname.startsWith(item.href + "/")) {
        const score = item.href.length;
        if (!best || score > best.score) best = { item, score };
      }
    }
  }
  return best?.item ?? null;
}
```

Mirrors current `isOrgNavItemActive` and `primaryNavItems` behavior — the TOC swap is visually different, functionally identical for active state.

---

## 4. Roman numeral display (section label)

- Rendered as literal `I.`, `II.`, `III.`, `IV.`, `V.` in Fraunces 400, opsz 24.
- `aria-label` on each `<section>` uses the **English word** for assistive tech: `<section aria-label="Studio">` so VoiceOver doesn't read "Section Roman numeral one".
- Roman numerals are **decorative**; the accessible name is the section English title.

---

## 5. Collapsed state (`Cmd+\`)

- Keyboard shortcut `Cmd+\` collapses the 240px TOC to a 48px rail.
- In the rail, only Roman numerals (`I`, `II`, `III`, `IV`, `V`) remain, vertically stacked, `py-[24px]` between.
- Clicking a roman numeral expands the whole TOC (not just that section) — avoids a third "per-section collapsed" state.
- Active section's numeral gets a vermilion `•` left of the numeral at collapsed width.

---

## 6. Mobile (`< 1024px`)

- TOC transforms into a top 56px strip with `rule-b` underneath.
- Roman numerals become a horizontal scroll chip bar; tapping a chip opens a bottom sheet listing that section's sub-items (same `@radix-ui/react-dialog` primitive as CommandBar).
- Active chip has a vermilion underline (2px, `rule-b` style) — not a background fill.
- No "burger menu" icon. No overlay drawer from the left.

---

## 7. i18n keys (S2 introduces these into `messages/*.json`)

Namespace: `Dashboard.toc.*`. Existing `Dashboard.sidebar.*` keys stay until the old sidebar component is fully deleted in S2.

```json
{
  "Dashboard": {
    "toc": {
      "collapse": "Collapse",
      "expand": "Expand",
      "studio": {
        "section": "Studio",
        "productions": "Productions",
        "projects": "Projects",
        "integrations": "Integrations",
        "channels": "Channels"
      },
      "scripts": {
        "section": "Scripts",
        "promptStudio": "Prompt Studio"
      },
      "library": {
        "section": "Library",
        "library": "Library"
      },
      "house": {
        "section": "House",
        "team": "Team",
        "organization": "Organization",
        "audit": "Audit",
        "admin": "Admin"
      },
      "settings": {
        "section": "Settings",
        "profile": "Profile",
        "billing": "Billing",
        "help": "Help"
      }
    }
  }
}
```

**CJK label considerations (S2 CREATIVE may refine):**

- Korean: "House → 편집실" (not 하우스 — editorial register).
- Japanese: "House → 編集室".
- zh-CN / zh-TW: "House → 编辑部 / 編輯部".

Translators may push back on a literal CJK rendering of "House"; the intent is **"editor's firm"**, not a residence.

---

## 8. What the TOC does NOT include

Explicit non-goals to prevent creep during S2 build:

- No search input inside the TOC — search is in `CommandBar` (`Cmd+K`).
- No user avatar / account switcher — top-right of Masthead owns the identity cluster.
- No notification bell / inbox — product does not ship one at MVP.
- No "What's new" / changelog pip — kept out of chrome.
- No theme toggle — Phase 2 (S7); until then, light-only.
- No nested disclosure triangles — sub-items always visible when section expanded; collapsed state hides them at the rail (§5).

---

## 9. References to legacy

The existing sidebar at [`src/components/dashboard/sidebar.tsx`](../../../src/components/dashboard/sidebar.tsx) implements:

- `primaryNavItems`: Overview / Library / Productions / Prompt Studio.
- `organizationNavItems` (admin only): Audit / Team / Billing / Settings.
- `bottomItems`: Billing / Settings / Help (for non-admins).

S2 replaces that file with [`src/components/desk/TOC.tsx`](../../../src/components/desk/TOC.tsx). No new structural sections appear (Overview has no TOC entry — the dashboard root is reached by clicking the "Elevate" wordmark in the TOC header, consistent with Linear).
