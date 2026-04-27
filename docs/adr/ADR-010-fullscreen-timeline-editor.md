# ADR-010: Fullscreen timeline editor architecture

**Status:** Proposed (2026-04-24)
**Related:**
[INIT-scene-image-to-video-and-publishing.md](../features/INIT-scene-image-to-video-and-publishing.md) §4.2 ·
[ADR-007-youtube-content-factory.md](ADR-007-youtube-content-factory.md) ·
[ADR-008-scene-source-upload-vs-runway.md](ADR-008-scene-source-upload-vs-runway.md) ·
[ADR-009-studio-image-providers-and-keyframes.md](ADR-009-studio-image-providers-and-keyframes.md)

## Context

Phase 1 (scene keyframes + Runway I2V) and Phase 3 (Buffer scheduled publishing)
shipped. The remaining Phase 2 slice is the web timeline editor — the only
UI surface left in the INIT blueprint. After surveying the current assembly
infrastructure the scope is smaller than originally drafted as L4:

- [`video-presets.ts`](../../src/lib/studio-productions/video-presets.ts)
  already declares title / subtitle / watermark / intro-outro config shapes.
- [`video-assembly-job-input.ts`](../../src/lib/studio-productions/video-assembly-job-input.ts)
  already supports the v2 `per_scene[]` shape with trim / loop / world time.
- [`assemble-video-per-scene.ts`](../../src/lib/studio-productions/assemble-video-per-scene.ts)
  (465 LOC) already normalizes per-scene clips, slices timed subtitles, mixes
  audio.
- The worker (`workers/video-assembly/run.ts`) already picks up
  `studio_video_assembly_jobs.input_json` and renders.

So the editor is, in essence, a **DSL generator** around an already-rich
server pipeline. What's missing is a visual editing surface, time-based
overlay scheduling, and a few new FFmpeg filters (multi-drawtext, xfade,
amix).

## Decision

### 1. Scope shape

UX/UI is redesigned from scratch but reuses the server pipeline (
preset helpers, per-scene normalizer, assembly worker). The editor is
fullscreen on its own route, not embedded in the episode detail page.

### 2. Editing DSL v3

New file `src/lib/studio-productions/editor-dsl.ts`. The DSL is a superset
of the v2 `VideoAssemblyJobInput` shape. The worker keeps accepting v1
and v2 inputs; v3 is converted on the server via `dslToAssemblyJobInput()`
before enqueueing the job. No migration: intermediate state lives in
`episode.pipeline_prefs.editor` (existing JSONB), final snapshots in
`studio_video_assembly_jobs.input_json` (existing column).

Structure (simplified):

- `scenes[]` — ordered, each with `sourceArtifactId`, `trimStartSec`,
  `targetDurationSec`, `loop`, `transitionToNextMs`.
- `overlays[]` — time-based text cards with `startSec`, `endSec`, style,
  animation.
- `audio` — `{ narration, bgm }` each with gain and optional fades.
- Top-level `version: 3`, `totalDurationSec`, `resolution`, `format`.

All fields are validated with handwritten narrow-typed guards (no Zod
dependency added; the repo's existing validators follow that convention).

### 3. Client quasi-preview

The editor renders preview via HTML5 `<video>` + CSS/Canvas overlays + two
`<audio>` elements (narration + bgm). Accuracy is ~90%: filter-only
effects (xfade, drawtext fade-in) are approximated with CSS transitions
or cuts. The final server render is always authoritative, and the UI
explicitly labels previews as approximations.

Remotion was considered and rejected. It would add a runtime dependency
and a new rendering path that duplicates the existing FFmpeg pipeline
without providing cross-platform parity. FFmpeg.wasm was also rejected
for bundle size (~30 MB) and mobile performance; revisit in a future ADR
if frame-perfect preview becomes a customer requirement.

### 4. FFmpeg server extensions

Three new filter builders in
`src/lib/studio-productions/ffmpeg-overlay-filter.ts`:

- `buildOverlayFilterGraph(overlays, totalDurationSec)` — multiple
  `drawtext` filters chained with `enable='between(t,s,e)'` for time
  control and `fade=in:d=X` for animation.
- `buildXfadeFilter(scenes)` — inserts `xfade=duration=X:offset=Y`
  between adjacent scenes when `transitionToNextMs > 0`.
- `buildAudioMixFilter(narration, bgm)` — `amix` + `volume` + `afade`
  for BGM composition.

These are stitched into `assembleVideo` in
[`video-assembly.ts`](../../src/lib/studio-productions/video-assembly.ts).
The legacy single-title path stays intact for the existing quick-assembly
button.

### 5. Route and chrome

New route `src/app/(dashboard)/dashboard/productions/[episodeId]/editor/page.tsx`
with its own `layout.tsx` that overrides the dashboard sidebar to give the
editor a truly fullscreen canvas. The layout stays under the dashboard
access gate so unauthenticated users still bounce.

### 6. Autosave and failure containment

The client store (a lightweight `useReducer` — no new dependency) debounces
save calls at 3 s. The save action stores the DSL in
`episode.pipeline_prefs.editor`. When the DSL exceeds the existing
`studioPipelinePrefsTooLarge` cap, the server instead persists a pointer
(latest `studio_video_assembly_jobs.id`) and surfaces a helpful toast.

Export is a separate action that validates the DSL, maps it to the
assembly job input, and inserts a row. The worker picks it up; the editor
polls for completion via the existing realtime channel.

## Consequences

**Positive**
- Zero new runtime dependencies. No Remotion, no FFmpeg.wasm.
- Zero migrations. The DSL lives in JSONB columns that already exist.
- The quick-assembly button keeps working — editor is opt-in power user UX.
- DSL versioning from day one (v3) makes forward changes safe.

**Negative**
- Preview accuracy is ~90% for filter-driven effects. We mitigate with
  explicit UI messaging and a one-click Export.
- Multiple `drawtext` filters stress `filter_complex` string length in
  FFmpeg. We unit-test the builder and cap overlay count at 16 per
  video.
- Custom timeline UI means we own the drag/trim/resize interactions. Bug
  surface lives in our repo, not a vendor's.

## Non-goals (Phase 2)

- Collaborative editing (no CRDT / y.js).
- Mobile editing UX (desktop-first; mobile remains view-only via the
  existing scenes overview).
- Asset browser / stock media library. BGM is supplied by URL or a
  Supabase Storage upload.
- Keyframe animation on overlays beyond fade / slide presets.
- PIP / multicam tracks.

## Related

- Phase 2 plan: `.cursor/plans/phase_2_timeline_editor_*.plan.md`
- Existing assembly engine:
  [`video-assembly.ts`](../../src/lib/studio-productions/video-assembly.ts),
  [`assemble-video-per-scene.ts`](../../src/lib/studio-productions/assemble-video-per-scene.ts)
