# Distribution pack: (slug)

**Shipped MDX:** content/blog/en/(slug).mdx, content/blog/ko/(slug).mdx  
**Date:** YYYY-MM-DD  
**Pillar:** P1 | P2 | P3 | P4 | P5 (see [memory-bank/marketing-pillars-m2.md](../../../memory-bank/marketing-pillars-m2.md))

**Production host:** https://YOUR_DOMAIN — replace below if using a preview URL.

---

## 1. Campaign summary (fill first)

| Field | Value |
|--------|--------|
| **ICP (one line)** | e.g. Marketing / product leads shipping AI in-market |
| **Primary CTA (this launch)** | Article reads → waitlist \| waitlist-first \| product page — pick **one** |
| **Primary conversion URL (en)** | e.g. https://YOUR_DOMAIN/?utm_source=…&utm_medium=…&utm_campaign=…&utm_content=waitlist_en#waitlist — **no /en** (default locale). |
| **Article URL (en)** | https://YOUR_DOMAIN/blog/YOUR_SLUG — **not** /en/blog/… (avoids 307 + broken X cards). |
| **Article URL (ko)** | https://YOUR_DOMAIN/ko/blog/YOUR_SLUG |
| **UTM campaign** | blog_SHORT_SLUG (use consistently across channels) |

---

## 2. UTM recipes (copy-paste)

Replace YOUR_DOMAIN and slug. Keep utm_campaign identical for one launch wave. **Use fenced blocks below** so pasted text has no stray backticks.

**Article (en) — X**

```text
https://<DOMAIN>/blog/<slug>?utm_source=x&utm_medium=social&utm_campaign=blog_<short_slug>&utm_content=en
```

**Article (ko) — X**

```text
https://<DOMAIN>/ko/blog/<slug>?utm_source=x&utm_medium=social&utm_campaign=blog_<short_slug>&utm_content=ko
```

**Waitlist (en)** — use when the post is CTA-first (query **before** #waitlist)

```text
https://<DOMAIN>/?utm_source=x&utm_medium=social&utm_campaign=blog_<short_slug>&utm_content=waitlist_en#waitlist
```

**Waitlist (ko)**

```text
https://<DOMAIN>/ko#waitlist?utm_source=x&utm_medium=social&utm_campaign=blog_<short_slug>&utm_content=waitlist_ko
```

Swap utm_source for threads or linkedin for other networks.

---

## 3. Hashtag tiers (discovery)

**English — Tier A (broad, ≤2)**  
#AI #MachineLearning (optional; noisy)

**English — Tier B (ICP)**  
#PromptEngineering #B2B #MarketingOps #ProductLedGrowth (pick 3–5 that match the post)

**English — Tier C (brand)**  
#Elevate

**Korean — Tier B + C (examples)**  
#프롬프트엔지니어링 #B2B #마케팅 #생성형AI #Elevate

**Rule:** Put hashtags **after** the hook and link on X/Threads so the first line is human. On LinkedIn, place **3–5** hashtags at the end.

**Paste format:** Put URL + hashtags inside a fenced **text** code block (same pattern as §2) so copy-paste into X does not include Markdown backticks.

---

## 4. X (Twitter)

**Post 1 — Article + hook (link preview)**  
Write hook (2–4 lines) as normal paragraphs, then:

```text
<URL with UTM>
#tag #tag …
```

**Post 2 — Same topic, KO**  
Same pattern.

**Optional thread 2/N**  
Teaser line without link, or one insight + “link in profile / prev post.”

---

## 5. Threads

Slightly longer hook; first line scroll-stopping. Link + hashtags in a fenced text block below the body.

---

## 6. LinkedIn (B2B)

**Title line (shows in feed)**  

**Body** 3–5 short paragraphs: problem → insight → what Elevate is building → CTA.

**Link** (article or waitlist — match primary CTA) in a fenced text block.  
**Hashtags** at end (same block or plain line).

---

## 7. One-liners (newsletter / Slack / DM)

- EN: …
- KO: …

---

## 8. Follow-up (virality mechanics)

Schedule **within 48h**:

- [ ] Quote or repost with a **stat or quote** from the article
- [ ] Second post: **waitlist** angle (different URL + utm_content)
- [ ] Reply to comments with **one** helpful micro-tip + soft CTA

---

## 9. SEO / META / OG

- og:image path from MDX front matter; validate after deploy ([BLOG_POST_PIPELINE.md](../../BLOG_POST_PIPELINE.md) §5.2).
- Hero **alt** for image posts (accessibility).

---

## 10. Measurement

- PostHog: elevate_blog_post_viewed, elevate_blog_post_share_channel, elevate_waitlist_submitted — see [POSTHOG_FUNNELS.md](../../POSTHOG_FUNNELS.md).
- Compare UTM utm_content / utm_source in analytics or server logs when evaluating this campaign.
