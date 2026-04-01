-- Optional Storage object path for signed download URLs (relative to app bucket).

alter table public.content_products
  add column if not exists storage_object_path text;

comment on column public.content_products.storage_object_path is
  'Path inside CONTENT_STORAGE_BUCKET (no leading slash), e.g. org-or-global/product/file.pdf';
