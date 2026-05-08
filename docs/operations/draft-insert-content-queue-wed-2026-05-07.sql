-- draft-insert-content-queue — Wed 2026-05-07
-- Topic SoT: docs/content-queue/topics/2026-05-07-cursor-session-discipline.md
-- Run in Supabase SQL editor ONLY if your role may insert into public.content_items.
-- If insert fails (RLS), create the row from /admin/content-queue instead and paste summary + metadata.

INSERT INTO public.content_items (
  type,
  title,
  slug,
  locale,
  summary,
  body_markdown,
  status,
  metadata
)
VALUES (
  'blog',
  'Cursor session discipline that actually ships',
  'cursor-session-discipline-that-ships',
  'en',
  'Timebox, one artifact, one stop rule—how to finish an AI editor session without tab thrash.',
  $md$
## Outline (expand to full post — see topic doc)

### Hook
Scene: late night, Cursor open, no clear "done."

### Why it matters
Starting is cheap; finishing is still expensive. Context thrash is the tax.

### What people miss
- Infinite exploration vs one outcome
- No stop rule
- No single shipped artifact

### Frame
Session = bounded box—one primary artifact.

### Actions (this week)
1. Timebox (e.g. 45m)
2. One branch or note in 3 minutes
3. Definition of done before first model call
4. Stop: ship or one paragraph "blocked because…"

### Elevate (short)
Content/ops mode—same loop for drafting; no roadmap promises.

### CTA
Join waitlist at /#waitlist
  $md$,
  'draft',
  '{
    "topic_axis": "ai_workflow",
    "axis_index": 1,
    "scheduled_slot": "2026-05-07",
    "slug": "cursor-session-discipline-that-ships",
    "rollout_locales": ["en", "ko"],
    "primary_sources": [],
    "topic_doc": "docs/content-queue/topics/2026-05-07-cursor-session-discipline.md",
    "pipeline_ref": "docs/BLOG_POST_PIPELINE.md",
    "review_gate": { "latest": { "status": "pending_outline", "reasons": [] } }
  }'::jsonb
);

-- After full MDX exists under content/blog/en|ko, either:
-- - transition status to approved + run publish pipeline, OR
-- - merge MDX via git and mark this row superseded in metadata.
