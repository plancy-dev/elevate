# Versioning, tags, and release notes

**Goal:** Ship **SemVer** consistently, keep **`CHANGELOG.md`** honest, and publish **blog MDX** release posts when **minor or major** versions change so users see momentum.

**Version source of truth:** `package.json` → `"version": "x.y.z"`. Git tags mirror it: `vx.y.z` (example: `v0.2.0`).

---

## SemVer mapping

| Bump | Meaning | `CHANGELOG.md` | Blog MDX (`/blog`) |
|------|---------|------------------|---------------------|
| **x** (major) | Breaking or redefined product promise (rare while `0.x`) | New `## [x.y.z]` section with sections Added/Changed/Fixed/Removed | **Required:** structured release post (en + ko) |
| **y** (minor) | User-visible features, meaningful UX, new surfaces | Same | **Required:** structured release post (en + ko) |
| **z** (patch) | Fixes, copy, perf, internal refactors; “continuous improvement” | New `## [x.y.z]` or bullets under `[Unreleased]` → fold into next patch cut | **Optional:** one-liner in `[Unreleased]` only; full post if marketing wants a story |

**Rule of thumb:** If a **non-technical reader** should hear about it, prefer **y** (or a dedicated patch post only when narrative matters).

---

## Release workflow (manual, repeatable)

1. **Decide the next version** (`x.y.z`) from the table above.
2. **Update `package.json`** version to match.
3. **Edit `CHANGELOG.md`:** move items from `[Unreleased]` into `## [x.y.z] — YYYY-MM-DD` using [Keep a Changelog](https://keepachangelog.com/) sections.
4. **If `x` or `y` changed:**
   - Copy [`docs/templates/release-notes-en.mdx.example`](templates/release-notes-en.mdx.example) → `content/blog/en/release-x-y-z.mdx` (slug: `release-0-2-0` style, digits only in the slug).
   - Copy the Korean example → `content/blog/ko/release-x-y-z.mdx`.
   - Adjust title, date, `description`, hero image under `public/blog/...` if needed.
5. **Git:** on `main` (or your release branch), commit with a conventional message, then:
   ```bash
   git tag -a vx.y.z -m "vx.y.z"
   git push origin main --tags
   ```
6. **Deploy** per your hosting (e.g. Vercel on push).

**Branches:** Trunk-based flow is fine: **`main` is releasable**; tags mark what shipped. Release branches (`release/x.y`) are optional and only needed if you hotfix old lines.

---

## Slug convention for release posts

- Pattern: `release-{major}-{minor}-{patch}` (e.g. `release-0-2-0` for v0.2.0).
- Must match blog slug rules: lowercase, digits, hyphens only ([`SLUG_RE`](../src/lib/blog/posts.ts)).

---

## What “users see”

| Artifact | Audience |
|----------|----------|
| **`CHANGELOG.md`** | Developers, contributors, GitHub readers |
| **Blog MDX** | Prospects, customers, community — “we ship” story |
| **Git tag `vx.y.z`** | Exact code snapshot for support and rollbacks |

---

## Related

- Blog pipeline: [`BLOG_POST_PIPELINE.md`](BLOG_POST_PIPELINE.md)
- Marketing funnel: [`CONTENT_FUNNEL.md`](CONTENT_FUNNEL.md)
