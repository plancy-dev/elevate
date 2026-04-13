# Blog post pipeline (Elevate)

**Purpose:** Repeatable steps so each post ships with **en + ko** (default), optional **meta/social packs**, and quality consistent with positioning in [`memory-bank/creative-elevate-ai-pivot.md`](../memory-bank/creative-elevate-ai-pivot.md). **Locale policy:** English first, then Korean for the same slug; additional locales only after an explicit “translate this” decision.

**Analytics:** Post views → `elevate_blog_post_viewed`; share dialog → `elevate_blog_post_share_channel` (+ `elevate_blog_post_share_link_copied` on **Copy**) ([`docs/CONTENT_FUNNEL.md`](CONTENT_FUNNEL.md)). CTAs → homepage waitlist `#waitlist`.

---

## 0. Gate: do we translate beyond en + ko?

| Question | If yes → | If no → |
|----------|----------|---------|
| Is the topic relevant to our core ICP in that locale soon? | Plan localized MDX under `content/blog/<locale>/` | Stay en + ko only. |

Ship **one slug** per topic across en/ko so `hreflang` and [`buildBlogPostAlternatesLanguages`](../src/lib/seo/locale-alternates.ts) stay aligned.

---

## 1. Brief (15 minutes)

- **Audience:** e.g. marketing + product leaders shipping with AI.
- **Job-to-be-done:** e.g. “reader understands why prompt quality is GTM, and clicks waitlist or returns.”
- **Pillar:** map to [`memory-bank/marketing-pillars-m2.md`](../memory-bank/marketing-pillars-m2.md) when applicable.
- **CTA:** default `[Join the waitlist →](/#waitlist)` (EN) / `[…대기명단…](/ko#waitlist)` (KO).

---

## 2. Outline & draft (English)

1. **Hook** — contrarian or lived experience (avoid generic “AI is transforming…”).
2. **Problem** — organizational, not only technical; name the hidden cost (rework, drift, governance).
3. **Insight** — one memorable frame (e.g. “prompt = product surface”).
4. **Elevate** — Prompt Studio, ebooks/Library, roadmap in **one short section** (not a brochure).
5. **Actionable takeaway** — steps that work without buying (builds trust).
6. **Policy note** (optional) — e.g. en/ko-first stance, if it reinforces honesty.
7. **Close + CTA** — single primary CTA.

**Length:** aim for **900–1,800 words** EN so the post feels “substantial” on first read; adjust for topic.

**Slug:** lowercase kebab-case, `a-z` and hyphens only ([`SLUG_RE`](../src/lib/blog/posts.ts)).

---

## 2.5 Voice & human edit pass (EN + KO)

Goal: copy should read like **a thoughtful person wrote it**, not like a template or a straight translation. Do this **after** a first draft exists, **before** you lock assets and run the review in §5.

### English — sound like a person

| Do | Avoid |
|----|--------|
| **Vary rhythm** — mix short punchy lines with longer explanatory ones; occasional question or aside. | Same sentence shape repeated (“X is Y.” “A is B.” “C is D.”). |
| **Contractions** where they fit the tone (`it’s`, `we’re`, `don’t`)—not mandatory everywhere, but enough to feel spoken. | Stiff formal tone throughout (reads like policy or a press release). |
| **One strong metaphor or frame**, then plain language for the rest. | Stacking abstract nouns (`operationalize`, `leverage`, `synergy`) without concrete examples. |
| **Concrete scenes**: Slack threads, 11pm tabs, “who’s awake.” | Generic “organizations must align stakeholders…” |
| **Read aloud** once; cut anything you wouldn’t say to a smart peer over coffee. | Buzzword bingo; AI tells like “In today’s fast-paced world…” |

### Korean — write **for Korean readers**, not **from English**

Treat KO as a **second original**, not a localization line-by-line.

| Do | Avoid |
|----|--------|
| **Reorder paragraphs** if Korean flow needs a different opener or bridge. | Matching English paragraph order when it feels unnatural in KO. |
| **Natural connectors**: 그런데, 솔직히, 아무튼, 그래서—where they earn their place. | Translationese: “~할 때 말이다”, “~에 불과하다” 남발, `이다`로만 끊는 단조로운 나열. |
| **Tone**: confident but conversational 블로그체 (해요/한다/다 섞임은 괜찮되, **한 가지 톤으로 통일**). | 전문 번역체(문서 번역), 과한 한자어 나열, 영어 제목·용어 그대로 남발. |
| **Idiom-level choices** that a Korean marketer would actually use. | English punchline을 억지로 직역 (제목·소제목 포함). |
| **Read aloud** (소리 내 읽기); 어색한 조사·접속사만 고쳐도 체감이 크다. | 영문 길이에 맞추려고 한국어 문장만 늘리기. |

### Shared checklist (both locales)

- [ ] **Skim test:** headings + first sentence of each section = standalone story.
- [ ] **One honest constraint or opinion**—stops the “everything is perfect” AI smell.
- [ ] **Product claims** still match [`creative-elevate-ai-pivot.md`](../memory-bank/creative-elevate-ai-pivot.md) / ADRs.
- [ ] **CTAs** unchanged in intent (`/#waitlist`, `/ko#waitlist`).

---

## 3. Assets (before MDX freeze)

| Asset | Notes |
|-------|--------|
| **Hero image (in-post)** | Store under **`public/blog/<slug>/hero.jpg`** (or `.webp`). Reference in MDX as `![alt](/blog/<slug>/hero.jpg)`. **Do not rely on remote hotlinks** for the hero—Unsplash URLs can 404 or be blocked; self-host for consistent rendering and social parity. |
| **`ogImage` (front matter)** | Optional. Same path as hero is typical, e.g. `ogImage: "/blog/<slug>/hero.jpg"`. Drives **Open Graph** and **Twitter** `summary_large_image` in [`blog/[slug]/page.tsx`](../src/app/[locale]/(marketing)/blog/[slug]/page.tsx). If omitted, site default **`/og-default.webp`** is used. |
| **OG dimensions** | Platforms accept a range; **1200×630** is the usual design target. In-post hero can be larger; for pixel-perfect cards, export a dedicated **`og.jpg`** at 1200×630 and set `ogImage` to that path. |
| **Keywords (SEO)** | 5–12 phrases; use in title, description, first `h2`, and naturally in body—no stuffing. |
| **Meta title / description** | Front matter `title` / `description` feed Next.js metadata. Keep description **~150–160 chars** where possible. |
| **Hashtags** | For social only; not rendered in MDX unless you want them in the post. |

---

## 4. Korean pass

- **Start from §2.5 (KO)**—native draft or full rewrite, not English-aligned paragraphs.
- Align on **facts and CTA** with EN; **wording and structure** may diverge where Korean reads better.
- Same **slug**, same **date**, same **`ogImage`** as EN unless you intentionally use a locale-specific OG asset (rare).
- Check all **internal links** use `/ko/...` and `/ko#waitlist` as needed.

---

## 5. Review & feedback (staging)

Run this **after** en + ko MDX exist, **before** wide distribution.

### 5.1 Local / preview

- [ ] `pnpm dev` — open **`/blog/<slug>`** (English, default locale; `/en/blog/…` redirects) and **`/ko/blog/<slug>`**.
- [ ] **Hero** loads (fixed path under `/public/blog/...`).
- [ ] **Caption / license** line is accurate; no broken outbound links.
- [ ] **Skim test:** headings tell the story; optional “if you’re skimming, jump to …” line for long posts.
- [ ] **CTA** clicks through to `/#waitlist` or `/ko#waitlist`.

### 5.2 Metadata & share cards

- [ ] **View source** or DevTools — `og:title`, `og:description`, `og:image` point to this post (not only the site default). `twitter:card` = `summary_large_image`.
- [ ] **Production URL:** After deploy, validate with [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/) (Meta) and [Twitter/X Card Validator](https://cards-dev.twitter.com/validator) or equivalent. **Slack/Discord/iMessage** often cache OG—use the debugger’s “scrape again” if the image updates.
- [ ] **`NEXT_PUBLIC_APP_URL`** in production matches the public origin so `og:image` is absolute and correct.

### 5.3 Editorial feedback (round)

| Pass | Focus |
|------|--------|
| **Accuracy** | Product claims match current roadmap (`creative-elevate-ai-pivot`, ADR). |
| **Voice** | Apply §**2.5**: EN human rhythm; KO as **second original** (not translationese). |
| **Cuts** | Remove duplicate ideas; tighten examples. |
| **A11y** | Hero `alt` in MDX describes the image; don’t rely on filename alone. |

Incorporate feedback in **both** locales unless the issue is language-specific.

---

## 6. Distribution pack (same PR or follow-up)

Create `docs/blog/distribution/<slug>.md` (not loaded by the app). **Goal:** each pack is a **mini growth brief**—not only copy-paste text, but **who should discover it, why they click, and what we want them to do next** (see [`CONTENT_FUNNEL.md`](CONTENT_FUNNEL.md): Awareness → Interest → `#waitlist` / product).

**Folder:** [`docs/blog/distribution/`](blog/distribution/) — see [`README.md`](blog/distribution/README.md) for the required sections and [`_TEMPLATE.md`](blog/distribution/_TEMPLATE.md) to start a new pack.

### 6.1 Funnel & CTAs (every pack must spell this out)

| Layer | Purpose | Typical URL (production) |
|-------|---------|---------------------------|
| **1 — Article** | Teach + earn trust; SEO/social landing | **English (default):** `https://<domain>/blog/<slug>` — **not** `/en/blog/…` (see below). **Other locales:** `https://<domain>/<locale>/blog/<slug>`. Add UTM. |
| **2 — Home + waitlist** | Primary conversion (Prompt Studio interest) | **English:** `https://<domain>/?utm_…#waitlist` (query before `#`). **Other locales:** `https://<domain>/<locale>#waitlist` + UTM. |
| **3 — Product** | Deeper interest (feature clarity) | **`/product/prompt-studio`** (English has no `/en` prefix); localized paths for other locales. |

**Default locale (`en`) and social crawlers:** With **next-intl** `localePrefix: "as-needed"`, paths like **`/en/blog/<slug>`** respond with **307** to **`/blog/<slug>`**. X / LinkedIn / Meta crawlers often **fail to render link preview cards** on the redirecting URL. **Always put canonical English links** (`/blog/…`, `/?…#waitlist`) in social posts and distribution packs — see [`docs/blog/distribution/README.md`](blog/distribution/README.md).

**Rule:** At least **one** social variant should point **straight to the article** (story + link preview); at least **one** variant (or a follow-up post the next day) can point to **`#waitlist`** with a one-line “why join” so measurement in PostHog separates **read** vs **signup intent** ([`POSTHOG_FUNNELS.md`](POSTHOG_FUNNELS.md)).

### 6.2 Discovery — hashtags & communities (not decoration)

Hashtags are for **topic feeds** (people who don’t follow you yet). Structure them in **three tiers** (copy-paste blocks in the pack):

| Tier | Role | Example intent |
|------|------|----------------|
| **A — Broad** | Reach | `#AI`, `#MachineLearning` (use sparingly; noisy) |
| **B — ICP** | Job/problem fit | `#PromptEngineering`, `#MarketingOps`, `#B2B`, `#GTM` |
| **C — Branded** | Recall | `#Elevate` (one per post is enough) |

**Platform norms (adjust per network):**

- **X:** Prefer **3–6** hashtags on discovery-oriented posts; put them **at the end** or after the link so the hook line stays human. Avoid the same hashtag set on every post (reads as spam).
- **Threads:** Similar to X; first line = hook; link + hashtags can follow.
- **LinkedIn:** **3–5** hashtags at the bottom is standard for B2B; lead with a professional hook, then link, then hashtags.
- **Hashtags in the blog MDX body:** Only if editorially useful; default is **social-only** (§3).

### 6.3 UTM (align with analytics)

Use a **consistent campaign name** per post, e.g. `utm_campaign=blog_<short_slug>`, and differentiate channel + locale:

- `utm_source=x` \| `threads` \| `linkedin` \| `newsletter`
- `utm_medium=social` (or `email` for newsletter)
- `utm_content=en` \| `ko`

Document the **exact query strings** in the pack so schedulers don’t invent ad-hoc names. Homepage waitlist links should repeat the same campaign where you’re driving **one** coordinated launch.

### 6.4 Required contents of `<slug>.md`

- **Positioning:** Pillar (from [`marketing-pillars-m2.md`](../memory-bank/marketing-pillars-m2.md)), one-line ICP, **single primary CTA** for the campaign.
- **Canonical URLs** (en + ko) + **UTM examples** for article and for `#waitlist`.
- **Hashtag tiers** (EN + KO if both ship).
- **X:** Short post(s) + optional thread; **Threads** variant; **LinkedIn** variant (B2B).
- **One-liners** for Slack / newsletter / DM.
- **Follow-up ideas** (reply, quote, “day 2” waitlist nudge)—so the pack isn’t a one-shot.
- **SEO/META / OG** reminders and image alt for image posts.

---

## 7. QA before ship

- [ ] `pnpm verify`
- [ ] Open **`/blog/<slug>`** (English) and **`/ko/blog/<slug>`**; CTA links work. For social sharing tests, use these canonical URLs (not `/en/…`).
- [ ] No broken MDX; images load; caption credits present.
- [ ] Front matter includes **`ogImage`** when you want post-specific link previews (see §3).
- [ ] **Voice:** §**2.5** pass done—read aloud once per locale; KO does not read like English translated line-by-line.

---

## 8. SemVer release posts (product “we ship” narrative)

For **minor** (`y`) or **major** (`x`) version bumps—not routine editorials—follow **[`VERSIONING_AND_RELEASES.md`](VERSIONING_AND_RELEASES.md)**:

- Copy **[`docs/templates/release-notes-en.mdx.example`](templates/release-notes-en.mdx.example)** → `content/blog/en/release-x-y-z.mdx` (slug uses digits, e.g. `release-0-2-0`).
- Copy **[`docs/templates/release-notes-ko.mdx.example`](templates/release-notes-ko.mdx.example)** → `content/blog/ko/release-x-y-z.mdx`.
- Update **[`CHANGELOG.md`](../CHANGELOG.md)** and **`package.json`** version in the same change set; tag **`vx.y.z`** on `main` when releasing.

**Patch** (`z`) releases: usually **`CHANGELOG.md` only**; add a blog post only when the story is worth a public note.

---

## 9. File checklist

```
public/blog/<slug>/hero.jpg        # or hero.webp / og.jpg (1200×630) for strict OG
content/blog/en/<slug>.mdx
content/blog/ko/<slug>.mdx
docs/blog/distribution/<slug>.md   # optional but recommended for social/meta
CHANGELOG.md                       # technical notes for every shipped version
tests/unit/blog-posts.test.ts      # update expected slugs for en/ko when posts change
```

**Related:** [`memory-bank/marketing-content-pipeline.md`](../memory-bank/marketing-content-pipeline.md), [`docs/MARKETING_OPS_CHECKLIST.md`](MARKETING_OPS_CHECKLIST.md), [`VERSIONING_AND_RELEASES.md`](VERSIONING_AND_RELEASES.md).
