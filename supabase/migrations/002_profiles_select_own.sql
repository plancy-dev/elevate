-- Allow every authenticated user to read their own profile row.
-- Needed when organization_id is null (new signups) so "same org" policy alone is not enough.

create policy "Users can select own profile"
  on public.profiles for select
  using (auth.uid() = id);
