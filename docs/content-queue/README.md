# Content queue — topic specs (repo SoT)

**Purpose:** Git-tracked **topic briefs** for `content_items` / admin content queue. When publishing from the DB pipeline, `body_markdown` is expanded from these docs; for **repo-first** posts, authors still use the same outline so **slug, axis, and locale rollout** stay aligned with [`docs/BLOG_POST_PIPELINE.md`](../BLOG_POST_PIPELINE.md).

**Naming:** `docs/content-queue/topics/YYYY-MM-DD-<short-slug-hint>.md` (date = scheduled publish or planning Wednesday).

**Operator SQL helpers** (optional inserts): [`docs/operations/`](../operations/) `draft-insert-content-queue-*.sql` — run only with intended Supabase role; review RLS.
