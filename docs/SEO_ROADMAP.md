# SEO & answer-engine visibility — roadmap (Elevate)

Goal: **blog and marketing URLs** are discoverable in Google Search, **AI Overviews / AI Mode** pick up accurate snippets, and **LLMs** can cite the brand when relevant—without overpromising “rank #1” (no one can guarantee that).

## Already in place (baseline)

- Next.js App Router with localized routes (`/[locale]/blog/...`)
- Per-post `metadata` (title, description, canonical, Open Graph) in `blog/[slug]/page.tsx`
- **`hreflang` via `alternates.languages`** — home (`/`), blog index (`/blog`), blog posts (only locales with MDX); `x-default` → default locale when available (`src/lib/seo/locale-alternates.ts`)
- **`sitemap.xml`** — `alternates.languages` on entries where applicable (`src/app/sitemap.ts`)
- `robots.txt` (verify production URLs)
- **BlogPosting** JSON-LD + **`inLanguage`**, **`isPartOf` → `WebSite`**, publisher `@id` aligned with marketing graph
- **Organization + WebSite** `@graph` on marketing layout (`src/lib/seo/site-jsonld.ts`, `MarketingSiteJsonLd`)
- **Naver Search Advisor** — `naver-site-verification` meta (`src/lib/seo/site-verification.ts`)
- **`/llms.txt`** — dynamic route; origin follows `NEXT_PUBLIC_APP_URL` (`src/app/llms.txt/route.ts`)

Manual steps after deploy: [`docs/SEO_MANUAL_CHECKLIST.md`](./SEO_MANUAL_CHECKLIST.md)

## Next work (prioritized)

| Priority | Area | Actions |
|----------|------|---------|
| P0 | **Indexing** | Google Search Console: property, sitemap submit, inspect URLs; fix crawl errors |
| P0 | **Technical SEO** | Consistent canonicals across locales; `hreflang` alternates if you want strict multi-region SEO; Core Web Vitals (LCP, CLS) on blog |
| P1 | **Content** | Unique titles/descriptions per post; internal links from home/product to pillar posts; FAQ / glossary pages for long-tail queries |
| P1 | **Schema** | Extend JSON-LD (`Organization`, `WebSite` with `searchAction` if you add site search); `BreadcrumbList` on blog |
| P2 | **AI / LLM** | Clear **About** and **Product** copy naming the company; `llms.txt` (optional convention) pointing to policy + sitemap; no keyword stuffing |
| P2 | **E-E-A-T** | Author bylines, `lastModified` if posts update, outbound citations to reputable sources |
| P3 | **International** | Dedicated `hreflang` + translated slugs strategy (avoid duplicate content without signals) |

## What does *not* guarantee “first place”

Search and AI summaries use many signals (authority, competition, freshness, user behavior). **Structured data and fast pages are necessary but not sufficient.** Treat “first in AI answers” as a **long-term brand + content + distribution** goal, not a single deploy.

## Related files

- Blog: `src/app/[locale]/(marketing)/blog/[slug]/page.tsx`
- Sitemap: `src/app/sitemap.ts` (or equivalent)
- Site URL helper: `src/lib/seo/site-url.ts`
