# Studio Productions — scenes (derived) vs artifacts (stored)

This doc complements [`STUDIO_ARTIFACT_ROLES.md`](./STUDIO_ARTIFACT_ROLES.md) and **[`ADR-003`](./adr/ADR-003-studio-productions-mvp.md)**.

## Mental model

| Layer | Responsibility | Primary storage |
|-------|----------------|-----------------|
| **Scene (product/UI)** | Ordered plan: narration, visual prompt, target duration, (future) per-scene status | Derived from `studio_production_episodes.pipeline_prefs` → `sceneRender.scenesJson` (JSON string) |
| **Artifact (persistence)** | Immutable or versioned outputs: URLs, text bodies, metadata | `studio_production_artifacts` rows |

**Scenes are not a separate table in v1.** The dashboard “Scenes” overview is a **read model**: it joins the scene plan JSON with `artifact_role = scene_clip` rows whose `metadata.scene_index` matches the plan row’s `index`.

## Linking plan rows to clips

- **Plan:** `parseSceneRows` in [`src/lib/studio-productions/scene-rows-json.ts`](../src/lib/studio-productions/scene-rows-json.ts) (client-safe array of `{ index, narration, visualPrompt, durationSeconds }`).
- **Clips:** `scene_clip` artifacts; typed metadata in [`src/lib/studio-productions/scene-clip-metadata.ts`](../src/lib/studio-productions/scene-clip-metadata.ts) (`scene_index`, `source`, `target_duration_sec`, …).
- **Assembly alignment:** [`buildPerSceneAssemblyClips`](../src/lib/studio-productions/build-video-assembly-input.ts) matches plan `index` to clips by `metadata.scene_index`, with **positional fallback** when `scene_index` is missing (legacy rows).

## Server resolution order (`resolveEpisodeScenes`)

When the pipeline needs a concrete scene list (e.g. Runway batch), [`resolveEpisodeScenes`](../src/lib/studio-productions/resolve-episode-scenes.ts) applies:

1. If `scenesJsonRaw` is non-empty and valid → use that array.
2. Else if `tts_audio` artifact exists with parseable segment timings in `metadata` → derive scenes from script + timings.
3. Else if `scriptText` is non-empty → heuristic split (`splitScriptToScenes`).
4. Else → error (no script / no scenes).

The episode UI “Scenes” panel uses **only** the persisted plan JSON (`pipeline_prefs` → `scenesJson`) via `scenePlanRowsFromPipelinePrefs`; it does not re-run TTS/heuristic resolution. That keeps the overview aligned with what the user saved in the Scene render step.

## UI placement

- **Scenes overview:** Episode → **Pipeline** tab (top of produce section): cards per plan row + clip status + deep link to `#scene-render-pipeline`.
- **Artifacts list:** Rendered **below** the episode workspace on the **Episode** workbench tab (no separate Artifacts tab). Non–`scene_clip` roles stay visible; `scene_clip` rows are **hidden by default** with a toggle to reduce duplication with the Scenes overview.

## Future (deferred): `studio_production_scenes` table

If we need **DB-backed per-scene status**, audit trails, or cross-session locking independent of `pipeline_prefs` JSON, introduce a normalized table (e.g. `studio_production_scenes` with `episode_id`, `sort_index`, `status`, optional FK from artifacts). **Not required** while `scenesJson` + `scene_clip.metadata.scene_index` remain the source of truth for Shorts assembly.
