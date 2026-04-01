-- Ebook-first catalog: distinguish digital product format (extends 009).

alter table public.content_products
  add column if not exists product_kind text not null default 'ebook'
  constraint content_products_product_kind_check
  check (product_kind in ('ebook', 'guide', 'template', 'bundle'));

comment on column public.content_products.product_kind is
  'Primary format for funnel: start with ebook; guides/templates/bundles for upsell.';
