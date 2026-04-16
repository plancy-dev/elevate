-- YouTube OAuth tokens per organization (Phase S4).
-- Stores encrypted OAuth refresh + access tokens for YouTube Data API v3 uploads.
-- One row per org+channel pair; tokens managed via studio integrations encryption.

create table public.studio_youtube_channel_tokens (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  channel_id text not null check (char_length(trim(channel_id)) > 0),
  channel_title text null,
  access_token_cipher text not null,
  refresh_token_cipher text not null,
  scopes text not null default 'https://www.googleapis.com/auth/youtube.upload',
  token_expiry timestamptz null,
  connected_at timestamptz not null default now(),
  last_used_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (organization_id, channel_id)
);

create index idx_studio_youtube_channel_tokens_org
  on public.studio_youtube_channel_tokens (organization_id);

comment on table public.studio_youtube_channel_tokens is
  'Encrypted YouTube OAuth tokens per org channel. Used by youtube-upload adapter for videos.insert.';

alter table public.studio_youtube_channel_tokens enable row level security;

create policy "Org members can select youtube channel tokens"
  on public.studio_youtube_channel_tokens
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can insert youtube channel tokens"
  on public.studio_youtube_channel_tokens
  for insert
  with check (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can update youtube channel tokens"
  on public.studio_youtube_channel_tokens
  for update
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );

create policy "Org members can delete youtube channel tokens"
  on public.studio_youtube_channel_tokens
  for delete
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
