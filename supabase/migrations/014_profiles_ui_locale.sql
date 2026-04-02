-- Preferred UI language for authenticated app surfaces (dashboard, admin).
-- Matches next-intl locale codes in src/i18n/routing.ts

alter table public.profiles
  add column if not exists ui_locale text;

alter table public.profiles
  drop constraint if exists profiles_ui_locale_check;

alter table public.profiles
  add constraint profiles_ui_locale_check
  check (
    ui_locale is null
    or ui_locale in ('en', 'ko', 'ja', 'zh-CN', 'zh-TW')
  );

comment on column public.profiles.ui_locale is
  'User preference: dashboard/admin UI language (next-intl locale code). NULL means default (en).';
