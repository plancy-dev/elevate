-- Recover stale processing rows in studio_video_assembly_jobs.
-- Worker crash safety: requeue old processing jobs, fail after max retries.

alter table public.studio_video_assembly_jobs
  add column if not exists retry_count int not null default 0;

alter table public.studio_video_assembly_jobs
  add column if not exists max_retries int not null default 3;

alter table public.studio_video_assembly_jobs
  add column if not exists processing_started_at timestamptz null;

update public.studio_video_assembly_jobs
set processing_started_at = started_at
where processing_started_at is null
  and started_at is not null;

create or replace function public.claim_studio_video_assembly_job()
returns setof public.studio_video_assembly_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid;
begin
  select j.id into rid
  from public.studio_video_assembly_jobs j
  where j.status = 'pending'
  order by j.created_at asc
  for update skip locked
  limit 1;

  if rid is null then
    return;
  end if;

  update public.studio_video_assembly_jobs
  set
    status = 'processing',
    started_at = now(),
    processing_started_at = now(),
    updated_at = now()
  where id = rid;

  return query
  select * from public.studio_video_assembly_jobs where id = rid;
end;
$$;

create or replace function public.reset_stale_studio_video_assembly_jobs(
  stale_before interval default interval '30 minutes'
)
returns table(requeued_count int, failed_count int)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with stale as (
    select
      j.id,
      j.retry_count,
      j.max_retries
    from public.studio_video_assembly_jobs j
    where j.status = 'processing'
      and coalesce(j.processing_started_at, j.started_at, j.updated_at)
        < now() - stale_before
    for update skip locked
  ),
  upd as (
    update public.studio_video_assembly_jobs j
    set
      retry_count = j.retry_count + 1,
      status = case
        when (j.retry_count + 1) >= j.max_retries then 'failed'
        else 'pending'
      end,
      error_message = case
        when (j.retry_count + 1) >= j.max_retries
          then concat_ws(' | ', nullif(j.error_message, ''), 'stale_timeout_max_retries')
        else concat_ws(' | ', nullif(j.error_message, ''), 'stale_timeout_requeued')
      end,
      started_at = null,
      processing_started_at = null,
      completed_at = case
        when (j.retry_count + 1) >= j.max_retries then now()
        else null
      end,
      updated_at = now()
    from stale s
    where j.id = s.id
    returning j.status
  )
  select
    count(*) filter (where status = 'pending')::int as requeued_count,
    count(*) filter (where status = 'failed')::int as failed_count
  from upd;
end;
$$;

revoke all on function public.reset_stale_studio_video_assembly_jobs(interval) from public;
grant execute on function public.reset_stale_studio_video_assembly_jobs(interval) to service_role;
