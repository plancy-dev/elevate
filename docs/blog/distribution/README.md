# Blog distribution packs (`docs/blog/distribution/`)

These Markdown files are **not** loaded by the app. They are **operator briefs**: copy-paste social copy, hashtag strategy, and UTM links so each post ships with **discovery + CTA intent**, not only article text.

## English URLs & link previews (X / LinkedIn / Meta) — important

This app uses **next-intl** with **`localePrefix: as-needed`** and **default locale `en`**.

| What you might write | What actually happens | Social preview |
|----------------------|------------------------|----------------|
| `…/en/blog/<slug>` | **307 →** `…/blog/<slug>` | Often **no** rich card — crawlers see the redirect response, not full `og:image` HTML. |
| `…/blog/<slug>` | **200** with metadata | **Yes** — canonical English blog URL. |
| `…/en#waitlist` | **307 →** `…/` (fragment may not survive as you expect) | Unreliable for cards. |
| `…/?utm=…#waitlist` | **200** home + hash | Use for **English** waitlist CTAs. |
| `…/ko/blog/<slug>` | **200** | **Yes** — non-default locales keep the prefix. |

**Rule:** For **English**, always share **`/blog/<slug>`** (article) and **`/?…#waitlist`** (waitlist with UTM **before** `#waitlist`). Do **not** use `/en/` in public links.

**Copy-paste:** Distribution packs list **plain paragraphs** (no Markdown code fences in the post body). Pasting triple-backtick fences into X wastes characters and can prevent link previews—use **normal https lines** only. **X:** 280 characters (free tier); use **short UTM** in the link (see each pack’s §2).

See also: [`BLOG_POST_PIPELINE.md`](../../BLOG_POST_PIPELINE.md) §6.1.

## Why this exists

Social posts need a different job than the blog:

| Piece | Job |
|--------|-----|
| **Blog MDX** | Depth, SEO, trust, internal CTAs (`#waitlist`) |
| **This pack** | Who finds the post (hashtags / feeds), **which URL** we measure (article vs waitlist), and **platform-shaped** hooks (X vs Threads vs LinkedIn) |

North Star alignment: [`memory-bank/creative-elevate-ai-pivot.md`](../../../memory-bank/creative-elevate-ai-pivot.md). Funnel stages: [`CONTENT_FUNNEL.md`](../../CONTENT_FUNNEL.md). Full pipeline: [`BLOG_POST_PIPELINE.md`](../../BLOG_POST_PIPELINE.md) §6.

## How to add a new post

1. Copy [`_TEMPLATE.md`](_TEMPLATE.md) → `<slug>.md`.
2. Fill **Campaign & CTAs** first (pillar, ICP, primary conversion URL).
3. Build **hashtag tiers** (broad → ICP → branded) per locale.
4. Paste **production** URLs; add UTM query strings from the template so PostHog/GSC stay interpretable.
5. Write **at least one** post aimed at **article + preview card**, and **at least one** path to **`#waitlist`** (same campaign, different `utm_content` or `utm_source`).

## Files

| File | Post |
|------|------|
| [`prompt-harness-beats-prompt-hacks.md`](prompt-harness-beats-prompt-hacks.md) | P1 longform — en + ko (`prompt-harness-beats-prompt-hacks`) |

## Related

- [`docs/MARKETING_OPS_CHECKLIST.md`](../../MARKETING_OPS_CHECKLIST.md) §E — channel setup, X/Threads, Linktree, UTM habits; **§E1a3** — Threads **커뮤니티**(예: AI Threads)로 올릴 때의 노출·UTM.
