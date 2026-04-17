# Studio Productions — suggested artifact roles

Episodes store **artifacts** (`studio_production_artifacts`) with free-text `artifact_role`. For team consistency and Shorts / Runway workflows, use these **short lowercase** names when possible:

| Role | Typical content |
|------|-----------------|
| `reference_source` | INIT/input sources: URLs, pasted text, manual notes. Metadata: `source_type`, `source_label` (see Reference panel). Pipeline read-only surfacing: [`features/PLAN-pipeline-source-visibility.md`](./features/PLAN-pipeline-source-visibility.md). |
| `script` | Hook, VO, captions — or a link to the doc |
| `prompt` | Full text prompt (e.g. Runway Step 1 frame prompt) |
| `settings` | JSON or prose for tool-specific options (e.g. Runway Step 2 selections); prefer `metadata` jsonb for structured blobs |
| `render_output` | Final asset URL or "where the file lives" |
| `tts_audio` | Generated TTS audio file (ElevenLabs, Edge-TTS). Metadata: voice_id, language, duration_ms |
| `subtitle_srt` | SRT/ASS subtitle file generated via Whisper. Metadata: word_count, language |
| `assembled_video` | Final assembled MP4 (clips + audio + subtitles). Metadata: resolution, duration, codec |
| `thumbnail` | Generated or uploaded thumbnail image for YouTube |
| `scene_clip` | Individual video clip for a single scene. Metadata: `scene_index`, `source` (`runway` \| `upload`), `target_duration_sec` (seconds; must match scene plan). Runway: `model`, `duration_seconds`, `task_id`, `output_urls`, etc. Upload: optional `trim_start_sec` (default 0), `loop` (default true when source is shorter than target). |
| `compliance_note` | Platform strikes, takedowns, yellow-card notes, remediation |
| `other` | Anything that does not fit (avoid abusing) |

**Order:** Rows are sorted by `sort_order`, then `created_at`. In the dashboard, the list shows **story order** (#1, #2, …). Edit an artifact to change **order** when you need to insert steps.

**Related runbooks:** [`RUNWAY_SHORTS_RUNBOOK.md`](./RUNWAY_SHORTS_RUNBOOK.md), [`RUNWAY_SCENE_BUILDER_STEP2.md`](./RUNWAY_SCENE_BUILDER_STEP2.md).

**ADR:** [`adr/ADR-003-studio-productions-mvp.md`](./adr/ADR-003-studio-productions-mvp.md) · [`adr/ADR-007-youtube-content-factory.md`](./adr/ADR-007-youtube-content-factory.md).
