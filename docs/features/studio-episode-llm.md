# Studio: channel-centric episodes + LLM drafts

This doc complements **[ADR-003](../adr/ADR-003-studio-productions-mvp.md)** (artifact ledger) and **[ADR-006](../adr/ADR-006-studio-provider-integrations-v2.md)** (org credentials + server calls). It records the **channel-scoped UX** and **LLM draft** behavior shipped alongside migration **`026_studio_channel_metadata_llm_threads.sql`**.

## Product

- **Episodes** stay on `studio_production_episodes`; optional **`studio_distribution_channel_id`** ties an episode to an org channel row for prompt context and navigation.
- **LLM output** for MVP is stored as **`studio_production_artifacts`** with `artifact_role` in `hook` | `title` | `script_draft`, and `metadata.source = "llm"` (plus provider/model). Regenerating or refining **replaces** prior LLM-sourced rows for those roles (user-edited rows use `source: user` from manual save — see `src/actions/studio-episode-llm.ts`).
- **Follow-up thread** (audit trail): optional table **`studio_episode_llm_threads`** (`episode_id`, `turns` jsonb). Populated on generate/refine; not required for the UI to function.
- **Channel metadata**: `studio_distribution_channels.metadata` jsonb (e.g. tone, audience line) is injected into the draft prompt (`buildDraftPrompt` in `src/lib/studio-productions/episode-llm.ts`).
- **First-draft mode** (`draft_generate_mode` from the episode panel): **`develop`** includes the current on-editor hook/title/script in the prompt for refinement; **`fresh`** omits that text and instructs the model to prioritize **Additional direction** over stale episode title/notes/niche/channel when they conflict (so a new topic is not pulled back toward an old angle).
- **Runway text-to-video from app**: `submitRunwayRenderJob` + org Runway API key + `STUDIO_INTEGRATIONS_ENABLED` (see `STUDIO_PROVIDER_API_CAPABILITY_MATRIX.md`). **YouTube upload from app**: still stub.

## Server boundary

- All generation runs in **Server Actions** behind **`STUDIO_INTEGRATIONS_ENABLED`** and **encryption configured** (`isStudioIntegrationsEncryptionConfigured`), using **`getOrgEditorContext`** for mutations.
- **Org LLM credential**: per-provider lookup (`getOrgLlmCredentialForProvider`) after the user picks **OpenAI vs Anthropic** and an **allowlisted model** on the episode draft panel (`src/lib/studio-productions/episode-llm-models.ts`). `getOrgLlmCredential` remains as a convenience (OpenAI first, then Anthropic) for code paths that do not show the picker.

## PostHog

Event names live in **`src/lib/analytics/posthog-events.ts`** (`ELEVATE_STUDIO_EPISODE_*`). Properties are minimal: **`episode_id`** only (no script content).

## Primary UX (CREATIVE)

See **`docs/features/creative-studio-channel-episode-ux.md`**: list filter `?channel=`, new episode `?channel=`, episode detail draft panel for editors (admin / organizer / coordinator).
