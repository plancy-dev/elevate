-- Link Toss payment intents to catalog rows for entitlement grants (B4).

alter table public.toss_payment_intents
  add column if not exists content_product_id uuid references public.content_products(id) on delete set null;

create index if not exists idx_toss_payment_intents_content_product
  on public.toss_payment_intents(content_product_id)
  where content_product_id is not null;

comment on column public.toss_payment_intents.content_product_id is
  'When set, successful payment grants organization_content_entitlements for this SKU.';
