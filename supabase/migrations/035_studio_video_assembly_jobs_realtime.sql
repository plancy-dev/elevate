-- Broadcast job row updates to authenticated clients (dashboard subscribes instead of tight polling).
-- Apply on the Supabase project used by the app + worker.

alter table public.studio_video_assembly_jobs replica identity full;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'studio_video_assembly_jobs'
  ) then
    alter publication supabase_realtime add table public.studio_video_assembly_jobs;
  end if;
end $$;

comment on table public.studio_video_assembly_jobs is
  'FFmpeg assembly queue: Next.js inserts pending rows; worker claims with claim_studio_video_assembly_job(), uploads MP4 to Storage, inserts assembled_video artifact. Realtime-enabled for dashboard progress.';
