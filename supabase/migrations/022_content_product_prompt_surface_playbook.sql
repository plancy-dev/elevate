-- G1 / M4: first web_only ebook SKU (MDX: content/ebooks/prompt-surface-playbook/index.mdx).
-- Lemon variant ↔ catalog: still attach via /admin/content → content_product_lemon_links (not in SQL).
-- Idempotent: safe to re-apply.

insert into public.content_products (
  slug,
  title,
  description,
  price_cents,
  currency,
  product_kind,
  delivery_mode,
  is_active,
  storage_object_path
) values (
  'prompt-surface-playbook',
  'The Prompt Is Your Product Surface — Playbook',
  'A short playbook for teams who want prompts to behave like an owned product surface—before compliance and voice drift in chat threads.',
  1900,
  'USD',
  'ebook',
  'web_only',
  true,
  null
)
on conflict (slug) do update set
  title = excluded.title,
  description = excluded.description,
  price_cents = excluded.price_cents,
  currency = excluded.currency,
  product_kind = excluded.product_kind,
  delivery_mode = excluded.delivery_mode,
  is_active = excluded.is_active;
