# Blog Authoring Templates (AI + Human)

Use this page as the single reference when creating new MDX posts for `content/blog/<locale>/`.

## Template map

- Public: [`blog-post-public.mdx.example`](./blog-post-public.mdx.example)
- Member: [`blog-post-member.mdx.example`](./blog-post-member.mdx.example)
- Premium: [`blog-post-premium.mdx.example`](./blog-post-premium.mdx.example)

## Access policy contract

- `access_tier: "public"`: anyone can read full article.
- `access_tier: "member"`: full article requires sign-in.
- `access_tier: "premium"`: full article requires active paid subscription.

## Authoring rules (always)

1. Keep slug lowercase kebab-case (`a-z`, `0-9`, `-`).
2. Set `date` in `YYYY-MM-DD`.
3. Set `ogImage` to an asset under `public/blog/<slug>/`.
4. Keep one primary CTA per post.
5. Keep facts aligned with current product state (no roadmap promises without confirmation).

## AI workflow (recommended)

1. Pick a template by target funnel stage (`public` / `member` / `premium`).
2. Copy the template into `content/blog/en/<slug>.mdx`.
3. Fill all placeholder sections with concrete details and examples.
4. Produce Korean version under `content/blog/ko/<slug>.mdx` with natural Korean copy (not line-by-line translation).
5. Run local check on:
   - `/blog/<slug>` (English default locale path)
   - `/ko/blog/<slug>`
6. Validate CTA destination and paywall behavior for the chosen `access_tier`.

## Quick publish checklist

- [ ] Frontmatter valid (`title`, `description`, `date`, `access_tier`).
- [ ] Body has actionable value (not only abstract claims).
- [ ] CTA links resolve correctly.
- [ ] Hero/OG image loads.
- [ ] `public/member/premium` behavior matches intent.
