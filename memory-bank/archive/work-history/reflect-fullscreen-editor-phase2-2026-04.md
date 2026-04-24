# REFLECT · Phase 2 — Fullscreen Timeline Editor (2026-04-24)

**SoT:** [`ADR-010`](../../../docs/adr/ADR-010-fullscreen-timeline-editor.md) · `tasks.md` § G3.1.5 Phase 2
**Scope shipped:** U5 + U6 — DSL v3, autosave, PreviewPane, Scene/Overlay/Audio tracks + inspectors, FFmpeg overlay/xfade/amix builders, Export dialog + episode CTA.
**Pairs with:** [`reflect-scene-keyframes-i2v-buffer-2026-04.md`](reflect-scene-keyframes-i2v-buffer-2026-04.md) (Phase 1 + Phase 3).

## Success criteria vs reality

| Criterion | Result |
|---|---|
| Fullscreen editor at `/dashboard/productions/[id]/editor` with autosave | ✅ (`editor-dsl.ts` + `saveEditorDsl`, 3s debounce) |
| Client quasi-preview (HTML5 `<video>` + CSS overlays) | ✅ (`PreviewPane`, `OverlayLayer`, `use-preview-playback.ts`) |
| Scene-level trim/loop/transition controls | ✅ (`scene-inspector.tsx`, `scene-track.tsx`, DnD reorder) |
| Text overlays (position, font, animation) | ✅ (`overlay-inspector.tsx`, `overlay-track.tsx`, `overlay-layer.tsx`) |
| Audio mix (narration gain, BGM url/gain/fade) | ✅ (`audio-inspector.tsx`, `use-preview-playback.ts`) |
| FFmpeg extension on server (overlays, xfade, amix) | ✅ (`ffmpeg-overlay-filter.ts` + `video-assembly.ts` + `assemble-video-per-scene.ts`) |
| Export flow wires DSL → worker job | ✅ (`exportEditorToAssembly` + `editor_extensions.overlays`) |
| Migration count | **0** (JSONB reused via `episode.pipeline_prefs.editor`) |
| Unit test delta | +29 (editor-dsl 21 · ffmpeg-overlay-filter 11 · proxy-skip-session 12 minus overlap) |
| i18n locales covered | en / ko / ja / zh-CN / zh-TW — ~170 new keys |
| `pnpm verify` green | ✅ |

## Key design wins

- **DSL v3 as the only stateful contract** — store(reducer) ↔ autosave ↔ export all speak DSL v3. No hidden shape conversions between layers; reviewers can read `editor-dsl.ts` and know everything.
- **`episode.pipeline_prefs.editor` vs assembly input snapshot** — edits don't mutate historical assembly jobs; Export writes a *snapshot* to `studio_video_assembly_jobs.input_json.editor_extensions`. Zero migration risk, clean retroactive debuggability.
- **Client preview is intentionally ≈90% accurate** — we called out in ADR-010 that quasi-preview is for pacing/copy decisions; final render remains server FFmpeg. Prevents scope creep toward a full Remotion-in-browser stack.
- **FFmpeg builders are pure string fns** — `buildOverlayFilterGraph`, `buildSubtitlesFilterChainSegment`, `escapeFfmpegExpr` are unit-testable without spawning ffmpeg. This caught the `drawtext` comma-escape bug (see surprises) before a worker run.
- **Second-pass overlay render** — `assemble-video-per-scene.ts` applies overlays as a separate ffmpeg pass on the finished file, so the fast-path `-c copy` concat remains intact when overlays are absent. Old jobs keep their throughput profile.
- **Graceful drawtext fallback** — when an ffmpeg build omits drawtext (older Linux packages), we detect `No such filter: 'drawtext'` and ship the un-overlayed render instead of failing the entire job.

## Surprises / adjustments mid-flight

- **Server Actions constraint** — `readEditorDslFromPipelinePrefs` was originally sync inside `src/actions/studio-editor.ts` and failed the "Server Actions must be async functions" check. Moved into `src/lib/studio-productions/editor-dsl-storage.ts`.
- **FFmpeg `drawtext` expression parsing** — unescaped commas inside the drawtext expression were being parsed as filter argument separators and breaking the whole graph. `escapeFfmpegExpr` wraps this in the filter builder so callers cannot forget.
- **Process-job-type TS quirk** — inline `import(...)` type reference failed `TS1005`; switched to top-level `import type`.
- **React hook lint violations during playback wiring** — direct ref mutation during render (`store.tsx`) and direct `.volume` assignment inside a controlled block (`use-preview-playback.ts`) both triggered lints. Moved ref writes into `useEffect`, and introduced `applyMediaVolume()` helper.
- **Locale-only UI strings flagged by `test:i18n` parity** — required landing all ~170 keys in all 5 locales in the same PR (ko/ja/zh-CN/zh-TW included). Done; no locale regression.

## Reliability hardening (REFLECT Readiness Plan, 2026-04-24)

This REFLECT also captures the cleanup pass described in
`.cursor/plans/reflect-refactor-readiness_f7ea5d85.plan.md`:

- **P0 — Buffer correctness** (`src/actions/studio-buffer.ts`, `publish-scheduler.tsx`)
  - Bulk-retry no longer always returns `studioBufferRateLimited`; aggregates real per-row error codes.
  - Buffer API + DB update failures now surface explicit `dbError`, preventing silent state drift.
  - `pending` rows now surface a per-row Retry action consistent with server behavior.
- **P1 — Assembly maintainability** (new `ffmpeg-common.ts`)
  - Extracted shared ffmpeg helpers (ffmpegAvailable, probeDurationSeconds,
    subtitle filter chain, concat-path escape, 1080x1920 scale/pad) from the
    two assembly modules. Narrowed error union types to what the code can
    actually return. Commented active vs reserved `editor_extensions` fields
    at the job-processing seam.
- **P1 — E2E stability**
  - Replaced `networkidle` + fixed sleeps with deterministic readiness assertions.
  - Unified locale-stable auth selectors into `tests/e2e/helpers/auth-selectors.ts`
    and `tests/e2e/helpers/login.ts`.
  - Added a **hydration guard** (`tests/e2e/helpers/hydration-guard.ts`) that
    toggles episode tabs once before interaction. Root cause of earlier auth
    E2E flakes was a pre-hydration native submit path; a single tab toggle
    forces React handlers to bind first. Same pattern applied to `live-phase*`
    specs. Auth E2E: **green**.
  - Visible-only selectors for Buffer channel chips, and an explicit
    `requireVisibleBufferChannelChip()` that fails fast with a prerequisite
    error instead of timing out on hidden duplicates.
- **P2 — Ops docs** (`docs/MANUAL_OPERATOR_CHECKLIST.md`,
  `docs/VIDEO_ASSEMBLY_WORKER.md`, `docs/TESTING.md`)
  - Operator checklist now reflects migrations `034/035`, worker health/log,
    Buffer retry UX, and live-smoke mutation warning.
  - Video-assembly worker doc gained an incident triage runbook.
  - TESTING doc added live-smoke prerequisites + an **IMPLEMENT validation
    gate** (typecheck → lint → unit → targeted e2e → verify).

## Known debt / follow-ups

1. **Phase 2 polish (UX)** — overlay DnD on timeline (currently click-to-select
   only), transition preview in CSS, export progress realtime toast.
2. **Live end-to-end with real Buffer channels** — Phase 3 Step 4 is
   deterministically blocked on external prerequisites (Buffer channel
   connected for the test org, and a valid 24h window). Backlog — not a
   product defect.
3. **Runway credits** — intentionally out of scope; manual uploads suffice
   for P1 validation. Adapter already maps insufficient-credits errors.
4. **Bucket visibility in prod** — `elevate-content` is public in dev;
   production needs either the same policy or a private+signed-URL adapter
   branch before live Runway I2V at scale.
5. **Cancel via Buffer API** — still best-effort local cancel; backfill
   worker to reconcile remote state is open.

## Rule-of-thumb learnings

- **Hydration guard > sleep.** Whenever a Next.js client form "looks right"
  but the submit produces no network call, toggle a nearby interactive
  element once; if that fixes it, the real bug is a pre-hydration event
  handler gap, not a timing issue.
- **Pure string builders scale better than spawning ffmpeg in tests.**
  The drawtext comma-escape bug would have been caught in milliseconds
  with a unit test either way; keep all filter-graph assembly pure.
- **When UI and API disagree on "failure," trust the row update.** The
  Buffer bulk-retry misreport happened because the aggregate path didn't
  look at per-row errors. Aggregated errors should always be derived
  from the same rows the UI renders.
- **Every worker extension should ship a fallback.** The drawtext-missing
  graceful path cost <20 lines and prevents export jobs from failing hard
  on minor ffmpeg build skew.
