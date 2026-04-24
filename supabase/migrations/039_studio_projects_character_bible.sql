-- Character Bible (visual identity) for studio_projects.
-- ADR-009: hybrid schema (recommended fixed fields + free-form extras) stored as JSONB,
-- plus Master Reference Image URL + internal storage path.
--
-- The existing `brand_guide text` column (brand voice / tone for LLM writing) remains unchanged.
-- Character Bible is a separate, structured VISUAL identity source consumed by:
--   - scene image prompt builder (IDENTITY LOCK block)
--   - Runway image-to-video prompt builder
-- See docs/adr/ADR-009-studio-image-providers-and-keyframes.md.

alter table public.studio_projects
  add column if not exists character_bible jsonb not null default '{}'::jsonb,
  add column if not exists character_reference_image_url text null,
  add column if not exists character_reference_image_storage_path text null;

comment on column public.studio_projects.character_bible is
  'Character Bible JSON (hybrid schema: fixed fields + extras). IDENTITY LOCK source for scene image and I2V prompts. See ADR-009.';

comment on column public.studio_projects.character_reference_image_url is
  'Public HTTPS URL of the Master Reference Image (used as provider reference/subject image).';

comment on column public.studio_projects.character_reference_image_storage_path is
  'Internal Supabase Storage path of the Master Reference Image (for deletion / re-signing).';
