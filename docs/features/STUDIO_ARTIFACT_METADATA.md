# Studio Artifact Metadata Schemas

`studio_production_artifacts.metadata` is intentionally flexible JSONB, but we now
validate and normalize known shapes with zod at server-action write paths.

Source of truth: `src/lib/studio-productions/artifact-metadata-schemas.ts`.

## Role groups

| Artifact roles | Schema |
| --- | --- |
| `hook`, `title`, `script`, `script_draft`, `prompt`, `settings`, `packaging_draft`, `social_captions`, `title_suggestion`, `compliance_note`, `reference_source` | `LlmMetadataSchema` |
| `scene_keyframe_candidate`, `scene_keyframe_first`, `scene_keyframe_last`, `thumbnail` | `ImageGenMetadataSchema` |
| `scene_clip` | `RunwayI2VMetadataSchema` |
| `tts_audio` | `ElevenLabsTtsMetadataSchema` |
| `assembled_video`, `render_output` | `FfmpegAssemblyMetadataSchema` |
| `subtitle_srt`, `subtitle_vtt` | `SubtitleMetadataSchema` |

## Compatibility policy

- Validation mode is **lenient-first**:
  - unknown keys are preserved (`.passthrough()`)
  - numeric strings are coerced where meaningful
  - parse failures fall back to original object instead of hard-failing writes
- This keeps existing production rows compatible while enabling gradual tightening.

## Lemon idempotency note

`lemon_squeezy_processed_orders.ls_order_identifier` is already the table
`PRIMARY KEY` (`018_lemon_squeezy_processed_orders.sql`), so no additional UNIQUE
migration is required for order-level idempotency.
