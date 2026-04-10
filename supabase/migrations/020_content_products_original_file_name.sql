-- Original client filename for downloads (Unicode-safe); storage path may still use sanitized leaf.
alter table public.content_products
  add column if not exists original_file_name text;

comment on column public.content_products.original_file_name is
  'Client-provided file name at upload (e.g. Korean PDF name) for Content-Disposition download; UTF-8.';
