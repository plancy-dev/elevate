# REFLECT · Scene keyframes + Runway I2V + Buffer scheduled publishing (2026-04-23 → 24)

**SoT:** [`docs/features/INIT-scene-image-to-video-and-publishing.md`](../../../docs/features/INIT-scene-image-to-video-and-publishing.md) · [`ADR-009`](../../../docs/adr/ADR-009-studio-image-providers-and-keyframes.md) · `tasks.md` § G3.1.5
**Scope shipped:** Phase 1 (U1+U2+U3) + Phase 3 (U7+U8+U9). Phase 2 (U5+U6 — timeline editor) is deliberately deferred.

## Success criteria vs reality

| Criterion | Result |
|---|---|
| `pnpm verify` + `pnpm test:i18n` green | ✅ |
| Unit test count delta | 243 → 270 (+27) |
| Migration count | 038, 039, 040, 041 (applied remote 2026-04-24) |
| i18n locales covered | en / ko / ja / zh-CN / zh-TW (5) |
| Provider docs link visible on every Integrations card | ✅ (`provider-docs.ts` SoT) |
| "Keys only, click click" UX | Achievable: single Gemini key generates keyframes, env BUFFER_API_KEY schedules posts. |

## Key design wins

- **Capability table abstraction (`runway-i2v-models.ts`)** — UI stays stable when Runway ships Last Frame on more models. No UI refactor required later.
- **`scene_clip` + `metadata.source = runway_i2v`** — I2V output plugs directly into the existing FFmpeg assembly pipeline. Zero additional code in the assembly worker.
- **Provider ID reuse for Gemini Imagen** — `google_gemini` covers LLM + images. Avoids a second credential slot and aligns with vendor reality.
- **Buffer env fallback (`BUFFER_API_KEY`)** — single-tenant UX works without filling the Integrations table; multi-tenant is opt-in via per-org row.
- **Idempotency key on `studio_scheduled_posts`** — `UNIQUE(organization_id, idempotency_key)` with `sha1(org|episode|channel|scheduled_at)`. Protects against double-submits without a distributed lock.

## Surprises / adjustments mid-flight

- **ADR-008 number was taken** (`scene-source-upload-vs-runway`). Phase 1 ADR became `ADR-009` mid-build. The plan file references ADR-008 but the repo file is ADR-009. Future ADR for LoRA → `ADR-010`.
- **`studio_projects.brand_guide` is TEXT, not JSONB** — D3 had to pivot from "extend JSONB" to "add a new JSONB column". Migration 039 does this additively; old `brand_guide` text stays put as the brand voice freeform slot.
- **`studio_production_artifacts.episode_id` is NOT NULL** — ruled out project-level artifact approach for Master Reference. Master Reference lives as columns on `studio_projects` instead.
- **Runway SDK already supports `promptImage` array with `position: first/last`** for gen3a_turbo, veo3.1, and veo3.1_fast. Discovered while reading the SDK types. This made D4 much cleaner than anticipated.
- **Phase 2 skipped to Phase 3** — at the user's direction when BUFFER_API_KEY was shared. No regret: P1 + P3 together form a complete "generate → schedule" loop without the editor. Editor is polish on top.

## E2E smoke — 2026-04-24

Ran the Phase 1 flow end-to-end in the real app with live Gemini + Supabase.

**What worked**
- Character Bible edit + save (11 fields, hybrid JSONB) persisted cleanly.
- Scene keyframe gallery rendered for all 7 scenes of the existing ttee episode
  after fixing the scene-plan lookup (see below).
- Gemini 2.5+ (Nano Banana 2) image generation for scene 0, 4 candidates,
  ~26 seconds total.
- Images stored in Supabase Storage, rendered in the gallery grid once the
  bucket was toggled to public.

**Bugs found + fixes**

1. **Scene plan source of truth mismatch** — `page.tsx` +
   `studio-scene-images.ts` + `studio-scene-i2v.ts` looked for a
   `settings/scene_plan` artifact, but scene plans live in
   `episode.pipeline_prefs.sceneRender.scenesJson`. Switched to
   `scenePlanRowsFromPipelinePrefs` so the gallery and both scene actions
   share one parser with the existing pipeline UI.

2. **Gemini model id drift (404)** — the hardcoded
   `gemini-2.5-flash-image-preview` does not exist in the live v1beta catalog.
   The actual Nano Banana 2 model is `gemini-3.1-flash-image-preview`
   ("Nano Banana 2" display name). Updated `IMAGE_PROVIDER_META.google_gemini.defaultModel`.

3. **Gemini `candidateCount > 1` unsupported (400)** — the image-generation
   branches of Nano Banana / Pro / 2 return
   `"Multiple candidates is not enabled for this model"`. Rewrote the adapter
   to fan out `count` parallel `candidateCount=1` requests, aggregate the
   images, and collapse errors (first non-success surfaces when the batch
   yields zero images).

4. **Supabase `elevate-content` bucket was private** — Runway I2V requires a
   public HTTPS URL, and Next.js `<Image unoptimized>` just 400s on a private
   object URL. Flipped the bucket to public via service-role
   `updateBucket({ public: true })`. All existing `studio-assembled` and
   `studio-scene-images` URLs are now accessible.

**Outcome:** scene keyframe grid renders 4 real Gemini images, watermark-free,
ready for First/Last promotion. Runway I2V round-trip not yet tested (credit
budget) but the remaining path is pure UI + the already-unit-tested adapter.

## Known debt / follow-ups

1. **Runway I2V live test** — still un-verified in the app. Will cost 2-10
   Runway credits per scene. Test with a single scene first, then scale.
2. **Bucket policy in production** — we flipped `elevate-content` to public
   in dev. If production uses the same bucket name, either: (a) confirm it is
   already public, or (b) plan a private bucket + signed URL variant before
   Runway I2V goes live. Runway SDK requires public HTTPS; private + signed
   works but needs a new adapter branch.
3. **`proxy.ts` bot / static-path middleware skip** — flagged by the user (33k daily DB requests). Phase 4 candidate.
4. **Phase 2 — timeline editor** is the next big slice. Editing DSL v2 proposal is sketched in the INIT doc §4.2 but hasn't been ADR'd.
5. **Cancel via Buffer API** — `cancelScheduledPost` only marks our row as cancelled; it does not call Buffer's deletePost. OK for MVP; a backfill worker should reconcile eventually.
6. **LoRA / fine-tuning** remains an explicit non-goal pending customer demand (ADR-010 candidate).

## Rule-of-thumb learnings for future phases

- When a plan cites an ADR number, **always verify the number is free before writing.**
- **Hand-editing `database.types.ts`** during a migration design cycle is fine *as long as* the schema and edits are re-verified with `pnpm db:types` once the remote DB is caught up. Don't leave it hand-edited for more than a session.
- When two phases share many files (types, i18n, provider-docs, tabs), **prefer one combined feat commit** over splitting by `git add -p` — the split is lossy and the commit history becomes fiction. Describe both phases in the message.
