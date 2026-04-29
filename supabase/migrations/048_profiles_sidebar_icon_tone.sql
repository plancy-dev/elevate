-- User profile preference: sidebar icon tone preset.

alter table public.profiles
  add column if not exists sidebar_icon_tone text not null default 'focus';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_sidebar_icon_tone_check'
  ) then
    alter table public.profiles
      add constraint profiles_sidebar_icon_tone_check
      check (sidebar_icon_tone in ('calm', 'focus'));
  end if;
end
$$;

comment on column public.profiles.sidebar_icon_tone is
  'User preference for collapsed sidebar icon tone preset (calm|focus).';
