# Blog Autopublish with Cursor SDK

This document sets up weekly automated blog generation + push using Cursor SDK.

## What this automation does

- Reads queued topics from `docs/blog/automation/topics.json`
- Runs Cursor SDK agent with repository context
- Generates:
  - `content/blog/en/<slug>.mdx`
  - `content/blog/ko/<slug>.mdx`
  - `docs/blog/distribution/<slug>.md`
- Marks the topic as `done` in the queue file
- Commits and pushes changes (scheduled run defaults to `main`)

## 1) Local setup

1. Copy `.env.local.example` to `.env.local` if needed.
2. Add:

```bash
CURSOR_API_KEY=your_real_cursor_api_key
CURSOR_MODEL=gpt-5.5
BLOG_AUTOPUBLISH_ENABLED=true
BLOG_AUTOPUBLISH_TOPICS_PATH=docs/blog/automation/topics.json
```

3. Edit queue file and set one topic to `pending`:
   - `docs/blog/automation/topics.json`
4. Dry-run prompt preview:

```bash
BLOG_AUTOPUBLISH_DRY_RUN=true pnpm run blog:autopublish
```

5. Real local run:

```bash
pnpm run blog:autopublish
```

## 2) GitHub Actions setup (weekly)

Workflow: `.github/workflows/blog-autopublish.yml`

Required GitHub repository secret:

- `CURSOR_API_KEY`: your Cursor API key

Optional GitHub repository variable:

- `CURSOR_MODEL`: defaults to `gpt-5.5`

Scheduled run:

- Every Monday 00:00 UTC
- Auto-commits and pushes to `main` when changes exist

Manual run:

- `workflow_dispatch` with input `push_mode`
  - `main`: push directly
  - `pr`: create a pull request

## 3) Queue format

Use `docs/blog/automation/topics.json`:

```json
{
  "topics": [
    {
      "slug": "your-topic-slug",
      "status": "pending",
      "locale": ["en", "ko"],
      "access_tier": "public",
      "title_hint": "Title hint",
      "target_reader": "AI product operators",
      "core_claims": ["Claim 1", "Claim 2", "Claim 3"],
      "references": ["https://..."],
      "cta_en": "[Join the waitlist ->](/#waitlist)",
      "cta_ko": "[대기명단에 참여하기 ->](/ko#waitlist)"
    }
  ]
}
```

## 4) Notes

- Keep `CURSOR_API_KEY` out of source control.
- If branch protection blocks direct push to `main`, use manual `push_mode=pr`.
- For deployment, use your existing main-branch deploy pipeline (e.g. Vercel auto-deploy on push).
