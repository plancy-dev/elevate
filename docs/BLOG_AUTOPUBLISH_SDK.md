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
- `AUTOMATION_GH_TOKEN`: PAT used by `create-pull-request` step when org default workflow permission is read-only

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
      "primary_sources": [
        { "url": "https://...", "note": "optional operator note" },
        { "path": "docs/some-internal.md", "note": "repo-relative path" }
      ],
      "cta_en": "[Join the waitlist ->](/#waitlist)",
      "cta_ko": "[대기명단에 참여하기 ->](/ko#waitlist)"
    }
  ]
}
```

**`primary_sources` (optional):** Array of `{ "url"?: string, "path"?: string, "note"?: string }`. Each entry must include at least one of `url` or `path` (repo-relative). The autopublish agent treats these as **primary evidence**—see the Evidence contract in `scripts/blog-autopublish-sdk.mjs`. If omitted, the agent should avoid specific third-party factual claims and write framework-first copy.

## 4) Notes

- Keep `CURSOR_API_KEY` out of source control.
- If branch protection blocks direct push to `main`, use manual `push_mode=pr`.
- For deployment, use your existing main-branch deploy pipeline (e.g. Vercel auto-deploy on push).

## 5) Token scope minimums (`AUTOMATION_GH_TOKEN`)

Recommended minimum repository scopes:

- `repo` (required for branch push + PR creation in private repos)
- `workflow` (recommended for operational reruns/dispatch visibility)

If your org allows fine-grained PATs, grant:

- **Repository contents**: Read and write
- **Pull requests**: Read and write
- **Actions**: Read (write optional for dispatch APIs)

## 6) Failure recovery playbook

The SDK runner writes `artifacts/blog-autopublish-status.json` with `failure_type`.

| failure_type | Typical cause | Operator action |
|--------------|---------------|-----------------|
| `auth` | Missing/invalid `CURSOR_API_KEY` or PR token mismatch | Rotate/update repo secrets and rerun workflow |
| `env` | Required env var missing from workflow mapping | Fix env mapping in workflow and rerun |
| `sdk_runtime` | SDK runtime dependency issue (`sqlite3`, ripgrep path, runtime agent error) | Reinstall runtime deps / inspect logs / rerun once |
| `content_validation` | Queue schema/output file mismatch | Fix `docs/blog/automation/topics.json` or output expectations |
| `unknown` | Uncategorized failure | Check summary + full logs, then rerun with `push_mode=pr` |

## 7) Quality gate policy (hard vs soft)

Workflow runs `pnpm run blog:quality-gate` after generation.

- Hard fail (blocks commit/PR):
  - missing frontmatter required keys
  - locale/slug/date structural mismatches
  - invalid internal CTA/link constraints:
    - public posts require waitlist CTA (`/#waitlist`, `/ko#waitlist`)
    - member/premium posts require at least one internal action link
- Soft fail (non-blocking warning in run summary):
  - repetitive AI boilerplate phrase detection

Quality gate artifact:

- `artifacts/blog-quality-gate.json`

