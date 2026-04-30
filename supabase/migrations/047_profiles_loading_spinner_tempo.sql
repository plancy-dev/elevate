-- User profile preference: global default loading spinner tempo.

alter table public.profiles
  add column if not exists loading_spinner_tempo text not null default 'calm';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_loading_spinner_tempo_check'
  ) then
    alter table public.profiles
      add constraint profiles_loading_spinner_tempo_check
      check (loading_spinner_tempo in ('calm', 'lively'));
  end if;
end
$$;

comment on column public.profiles.loading_spinner_tempo is
  'User preference for default Elevate loading spinner tempo (calm|lively).';
