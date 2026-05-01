-- Allow explicit retry-window run typing in content run logs.
alter table public.content_runs
  drop constraint if exists content_runs_run_type_check;

alter table public.content_runs
  add constraint content_runs_run_type_check
  check (
    run_type in ('ingest', 'draft_generate', 'review_gate', 'publish', 'publish_retry_failed')
  );
