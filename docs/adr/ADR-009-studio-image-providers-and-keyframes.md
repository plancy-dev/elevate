# ADR-009: Studio image providers and scene keyframes (First/Last Frame)

**Status:** Proposed (2026-04-23)
**Related:**
[INIT-scene-image-to-video-and-publishing.md](../features/INIT-scene-image-to-video-and-publishing.md) ·
[ADR-003-studio-productions-mvp.md](ADR-003-studio-productions-mvp.md) ·
[ADR-006-studio-provider-integrations-v2.md](ADR-006-studio-provider-integrations-v2.md) ·
[STUDIO_ARTIFACT_ROLES.md](../STUDIO_ARTIFACT_ROLES.md)

## Context

ADR-003 locks down the episode/artifact ledger. ADR-006 introduces org-scoped provider credentials. The next step in the
creator workflow is to generate **scene keyframes** (per-scene first/last frame images) that drive **image-to-video**
rendering for visual coherence. The core product insight: **"When the start (First Frame) and end (Last Frame) of a scene
are fixed, AI-generated video output is substantially more structurally consistent."**

Today the repo only has a single image generation path — DALL·E 3 for YouTube thumbnails, inside
[`src/actions/studio-pipeline-presteps.ts`](../../src/actions/studio-pipeline-presteps.ts) `generateThumbnailImageFromEpisode`. No provider abstraction, no scene-scoped image artifacts, no image-to-video adapter.

## Decision

### 1. Provider abstraction

Introduce `src/lib/studio-integrations/providers/images/` as the single entry point for image generation across providers.
Server-only, fetch-based (same pattern as existing `*-verify.ts` and Runway text-to-video adapter). No client SDKs.

### 2. Provider set (Phase 1)

| Provider ID (in `studio_org_provider_connections.provider`) | Purpose | Reference field |
|-----|-----|-----|
| `google_gemini` (existing — re-used for Imagen) | Gemini 2.5 Flash Image (Nano Banana 2) | `contents.parts[{inline_data}]` |
| `flux_replicate` (new) | FLUX via Replicate | `image` (Redux) |
| `flux_fal` (new) | FLUX via fal.ai | subject_reference |
| `seedream` (new) | BytePlus Seedream | reference image |

**Migration:** `038_studio_org_provider_image_providers.sql` extends the provider CHECK constraint with
`flux_replicate`, `flux_fal`, `seedream`. Gemini stays on the existing `google_gemini` slot (one API key per org for LLM
and image together).

**LoRA / fine-tuning is a non-goal for Phase 1.** Cost and governance across multiple vendors are prohibitive for an MVP;
revisit in a future ADR if customer feedback demands it.

### 3. Scene keyframe artifact roles

Three new values in [`STUDIO_SUGGESTED_ARTIFACT_ROLES`](../../src/lib/studio-productions/artifact-roles.ts) (free-text DB,
no migration required):

| Role | Per-scene cardinality | Description |
|-----|-----|-----|
| `scene_keyframe_candidate` | N (typically 4) | Raw outputs from an image provider for a given scene. |
| `scene_keyframe_first` | 0..1 | The candidate promoted to First Frame for that scene. |
| `scene_keyframe_last` | 0..1 | The candidate promoted to Last Frame for that scene. |

Slot uniqueness (first/last) is enforced at the server action layer (flip the old slot artifact back to `candidate` before
promoting a new one). This avoids DB triggers and preserves audit history in metadata.

**Storage:** Supabase Storage under `studio-scene-images/{org}/{episode}/scene-{index}-{fileId}.{ext}`, mirroring the
`scene-clip-storage.ts` pattern. `external_url` on the artifact = the public URL; `metadata.storage_path` = the internal
path for deletion.

### 4. Metadata shape

```ts
type SceneKeyframeMetadata = {
  scene_index: number;
  provider: "google_gemini" | "flux_replicate" | "flux_fal" | "seedream";
  model: string;              // e.g. "gemini-2.5-flash-image"
  prompt_used: string;        // stored for audit + reproducibility
  reference_image_id?: string; // Master Reference artifact/project field id
  watermark_free: boolean;
  storage_path: string;
  mime_type: string;
  width: number;
  height: number;
  seed?: number;
  generated_at: string;       // ISO 8601
};
```

### 5. Character Bible

**Migration `039_studio_projects_character_bible.sql`** adds three columns to `studio_projects`:

- `character_bible jsonb not null default '{}'::jsonb` — hybrid schema (fixed recommended fields + `extras` map).
- `character_reference_image_url text null` — public HTTPS URL of the Master Reference Image.
- `character_reference_image_storage_path text null` — internal Storage path (for deletion).

The existing `brand_guide text` column remains for brand voice / tone (LLM writing bias). The Character Bible is a
separate, structured source of **visual** identity used to prefix an IDENTITY LOCK block to every scene image and I2V
prompt.

Recommended fixed fields: `name`, `age`, `appearance` (hair / eyes / skin / ethnicity), `wardrobe`, `style`,
`color_palette` (primary / secondary / accent). Anything extra goes in a free JSON `extras` object.

### 6. Watermark policy

Adapters must request "no watermark" on providers that offer the parameter (Gemini, FLUX, Seedream). Adapter responses
set `metadata.watermark_free: true` only when the call is known-safe. The UI **blocks** promotion of a candidate to
`scene_keyframe_first` / `scene_keyframe_last` when `watermark_free: false`, and surfaces an explanation linking to the
provider's documentation.

### 7. Image-to-video bridge (Runway)

The existing `runway` provider entry gets a second adapter: `providers/runway/runway-image-to-video.ts` wrapping the
Runway SDK `imageToVideo.create()` endpoint. Model capability table:

| Model | First Frame | Last Frame |
|-----|-----|-----|
| `veo3.1` (Phase 1 default) | required | supported |
| `veo3.1_fast` | required | supported |
| `gen3a_turbo` | required | supported |
| `gen4.5` | required | not supported |
| `gen4_turbo` | required | not supported |
| `veo3` | required | not supported |

For models without last-frame support, the UI still lets users pick a `scene_keyframe_last` candidate; the adapter
incorporates it into the `promptText` as an "end-state description" instead of the API array. When Runway (or another
I2V provider) ships end-frame guidance on more models, only the capability table changes — the UI remains stable.

### 8. Public documentation links (UX requirement)

Every provider card, scene image gallery, Character Bible editor, and I2V CTA must surface a **"View official guide"**
link. SoT: `src/lib/studio-integrations/provider-docs.ts` — a map from provider ID to `{ apiDocsUrl, pricingUrl?, tosUrl? }`.
This keeps users anchored to the canonical vendor documentation even when our product copy drifts.

## Consequences

**Positive**
- One abstraction, four vendors on day one — users can bring any key they already own.
- Scene keyframe artifacts plug directly into the existing ledger/RLS/audit path.
- I2V model capabilities isolated behind a table → easy to extend.
- Watermark policy is enforceable at the ledger level (`metadata.watermark_free`).

**Negative / Risks**
- Four vendor APIs to track (spec drift, rate limits, pricing).
- Runway still charges per I2V task; we rely on preflight credit estimation (`runway-scene-credits-estimate.ts`).
- Character Bible adds a JSONB column — migration ordering matters (038 before 039 by file numbering, independent).

## Non-goals (Phase 1)

- Organization / project monthly caps (Phase 4 backlog).
- LoRA or per-character fine-tuning (future ADR if demanded).
- Scene-level provider override (UI complexity vs. value — episode-level override is the ceiling).
- Non-Runway image-to-video providers (Luma, Kling, etc.) — the abstraction is designed to admit them, but Phase 1
  ships with Runway only.
