-- Allow org members to read Lemon order idempotency rows for their organization.
-- (Purchase history UI lists catalog unlocks from entitlements instead; this policy remains for consistency, tooling, or future UI.)

create policy "Org members can view lemon processed orders for their org"
  on public.lemon_squeezy_processed_orders
  for select
  using (
    organization_id = public.user_organization_id()
    and public.user_organization_id() is not null
  );
