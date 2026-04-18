# ADR-003: Studio Productions MVP (org-scoped production ledger)

## Status

**Accepted** — MVP shipped (org-scoped episodes + artifacts, RLS, dashboard routes). Review notes: [`docs/features/GSTACK_REVIEW-production-workbench.md`](../features/GSTACK_REVIEW-production-workbench.md).

## Context

### Business

Founders and operators will **dogfood** external creative tools (Runway, Kling, ChatGPT, Gemini) to ship **YouTube Shorts** and other deliverables. The value Elevate adds in this phase is **structured memory**: one place to attach **prompts, settings, links, and notes** to a **deliverable** (for example one Short), scoped to an **organization**. This supports case studies and future Prompt Studio integration without pretending we operate Runway inside our stack.

**v1 product consensus (locked):** Elevate does **not** integrate with external tools in the API sense. v1 is **ledger + navigation aids only**: **saved links** (open in a new tab), optional **shortcuts** (static “open Runway / ChatGPT …” entry points or the same as bookmarks), and **labels** (`tool_platform`, `artifact_role`) so rows are scannable. “We support these workflows” is communicated by **documentation and UI copy**, not by OAuth or server-side calls. Full integration is **explicitly unnecessary** for current goals and out of scope until a later ADR.

### Technical

- [`ADR-002`](ADR-002-prompt-studio-mvp.md) covers LLM-backed **improvement**. This ADR covers **persistence of user-authored artifacts**. They complement; neither replaces the other.
- **Library** remains **catalog and entitlements** only (`getLibraryPageData` / `content_products`). User-generated “production” rows must not live there.

## Decision

### 1. Naming

- **User-facing (EN):** “Productions”
- **User-facing (KO):** “제작” (or “콘텐츠 제작” if you need disambiguation in nav)
- **Internal table prefix:** `studio_production_*` to group under the Studio product line and avoid collision with MICE `events` / `sessions`.

### 2. Schema (v1)

**Table: `studio_production_episodes`**

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK → `organizations(id)` ON DELETE CASCADE | |
| `title` | text NOT NULL | Human label, e.g. “Short 2026-04-08 — hook A” |
| `status` | text NOT NULL CHECK in (`draft`, `ready`, `published`, `archived`) | |
| `publish_url` | text NULL | Canonical public URL (YouTube, etc.) |
| `distribution_label` | text NOT NULL DEFAULT '' | Optional: “stealth channel A”, “official Elevate” |
| `notes` | text NOT NULL DEFAULT '' | Freeform |
| `created_by` | uuid NULL FK → `profiles(id)` | |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

Index: `(organization_id, updated_at DESC)`.

**Table: `studio_production_artifacts`**

| Column | Type | Notes |
|--------|------|--------|
| `id` | uuid PK | |
| `organization_id` | uuid FK → `organizations(id)` ON DELETE CASCADE | **Denormalized** from episode for RLS (set on insert from parent) |
| `episode_id` | uuid FK → `studio_production_episodes(id)` ON DELETE CASCADE | |
| `artifact_role` | text NOT NULL | e.g. `prompt`, `negative_prompt`, `script`, `settings`, `render_output`, `thumbnail`, `other` |
| `tool_platform` | text NOT NULL | e.g. `runway`, `kling`, `gemini`, `chatgpt`, `other` |
| `content_text` | text NOT NULL DEFAULT '' | Main body (prompt or script) |
| `external_url` | text NULL | Link to asset or tool page |
| `metadata` | jsonb NOT NULL DEFAULT '{}' | Model name, seed, resolution, **no secrets** |
| `sort_order` | int NOT NULL DEFAULT 0 | Display order within episode |
| `created_at` | timestamptz | |

Index: `(episode_id, sort_order)`.

**Shorts planning & channels (follow-up migration, e.g. `023_studio_niches_format_packs_channels.sql`)**

Reference data and org-scoped links extend the ledger without vendor APIs:

- **`studio_niches`** — Curated interest verticals (slug, display name, sort). Seeded in migrations; RLS allows authenticated read of active rows.
- **`studio_format_packs`** — Bundles of templates under a niche (`studio_niche_id`, unique slug per niche).
- **`studio_format_templates`** — Repeatable short patterns: duration hint, hook/script shell text, optional `metadata` jsonb. Episodes may reference one template.
- **`studio_distribution_channels`** — Per-org saved channel pages (`label`, `platform` check, **HTTPS** `channel_url`). Used for one-click “open channel” from the dashboard.

**`studio_production_episodes` (additional columns)**

| Column | Type | Notes |
|--------|------|--------|
| `studio_niche_id` | uuid NULL → `studio_niches` | Planning / reporting |
| `studio_format_template_id` | uuid NULL → `studio_format_templates` | Chosen format; pack niche must match `studio_niche_id` when both set |
| `studio_distribution_channel_id` | uuid NULL → `studio_distribution_channels` | Target channel; must belong to same `organization_id` |

Triggers enforce org match on the channel FK and niche/template consistency. The UI may show “Shorts plan” (niche, format, topic line, channel) only when the user’s **distribution preset** is YouTube Shorts, while `distribution_label` remains the existing freeform/preset string for publish URL hints.

**RLS**

- Enable RLS on both tables.
- Policies: authenticated users may **select/insert/update/delete** rows where `organization_id = public.user_organization_id()` and `user_organization_id()` is not null.
- **No** policy for anonymous.

**Trigger (recommended)**

- `BEFORE INSERT OR UPDATE ON studio_production_artifacts`: set `organization_id` from parent episode if null or inconsistent; **raise** if episode belongs to another org.

Alternatively, enforce org match only in application layer **if** you add tests; trigger is safer.

### 3. Application layer

- **Routes:** Under `src/app/(dashboard)/dashboard/productions/` (or `studio/productions/` — pick one path; **one** only).
- **Data access:** Server Components + Supabase server client; mutations via Server Actions with session check.
- **i18n:** `Dashboard.productions.*` keys.
- **Links:** `publish_url` and artifact `external_url` render as **plain HTTPS links** (`rel="noopener noreferrer"`). No embeds, no preview fetch, no API keys.
- **Education (optional in v1):** A short static block or help panel (“You can use Runway, Kling, …”) is **copy only**. It does not call vendor APIs.

### 4. Out of scope (v1)

- **Any** Runway / Kling / YouTube / Gemini **server-side integration** (OAuth, webhooks, upload, job status). v1 = **user pastes URLs and text**; the app stores and displays them.
- File blobs in Supabase Storage.
- Prompt Studio `POST /api/studio/improve` wiring (optional follow-up: “Send to Studio” button with query param).
- Public sharing pages.

### 5. PostHog (follow-up, not blocking)

- Add **one** enum or const object for events such as `studio_production_episode_created` if product analytics needs it. Do not scatter string literals ([`.cursor/rules/posthog-integration.mdc`](../../.cursor/rules/posthog-integration.mdc)).

## Consequences

### Positive

- Clear domain model for dogfood and case studies.
- RLS aligned with existing multi-tenant patterns.

### Negative

- Denormalized `organization_id` on artifacts must stay consistent (trigger or strict server checks).
- Another surface to maintain alongside Library and Studio placeholder.

## Migration

- File: `supabase/migrations/017_studio_productions.sql` (number adjusted if 017 taken).

## v2 extension (optional provider APIs)

Optional **org-scoped credentials and server adapters** (OpenAI, Runway, YouTube Data API, etc.) are specified in **[`ADR-006`](ADR-006-studio-provider-integrations-v2.md)**. They **do not** change v1 guarantees when feature flags are off; v1 remains paste-only.

## Appendix: Scenes as a derived view (post-MVP UI)

The **Scenes** overview in the episode Pipeline tab is not a new persistence layer: it reads **`pipeline_prefs.sceneRender.scenesJson`** and joins **`scene_clip`** artifacts via **`metadata.scene_index`**. Full diagram and `resolveEpisodeScenes` priority are documented in **[`docs/STUDIO_SCENES_AND_ARTIFACTS.md`](../STUDIO_SCENES_AND_ARTIFACTS.md)**. A future **`studio_production_scenes`** table remains optional until per-scene DB state or audit requirements justify migration.

## Related

- [`ADR-002`](ADR-002-prompt-studio-mvp.md) Prompt Studio MVP
- [`ADR-006`](ADR-006-studio-provider-integrations-v2.md) Studio provider integrations (v2)
- [`docs/features/studio-episode-llm.md`](../features/studio-episode-llm.md) Channel context + LLM draft artifacts + optional `studio_episode_llm_threads`
- [`docs/features/GSTACK_REVIEW-production-workbench.md`](../features/GSTACK_REVIEW-production-workbench.md)
- [`src/lib/data/library.ts`](../../src/lib/data/library.ts) (contrast: catalog only)
