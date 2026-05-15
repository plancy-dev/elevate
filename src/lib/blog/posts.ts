import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { z } from "zod";
import { routing } from "@/i18n/routing";

const BLOG_ROOT = path.join(process.cwd(), "content/blog");
const ALLOWED_LOCALES = new Set<string>(routing.locales);

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** Optional last-modified date (frontmatter `modified`). Falls back to `date` for dateModified JSON-LD. */
  modified?: string;
  accessTier: "public" | "member" | "premium";
  isPremium: boolean;
  /** Absolute path from site root for OG/Twitter preview, e.g. `/blog/my-slug/hero.jpg`. Must live under `public/`. */
  ogImage?: string;
  /** Optional credit line for the hero (keep out of MDX body—use meta or image `alt` only). */
  heroPhotoCredit?: string;
  /** Optional internal editorial note for the hero (not rendered as article prose). */
  heroNote?: string;
  /** Tags from frontmatter — surfaced in JSON-LD `keywords` + Related posts intersection. */
  tags?: string[];
  /** Estimated reading time in minutes (computed from body). */
  readingMinutes: number;
  /** Word count of body (computed). Used in BlogPosting JSON-LD `wordCount`. */
  wordCount: number;
  /** If true, frontmatter explicitly excluded this post from sitemap + adds noindex meta. Used for stub/thin posts. */
  noindex: boolean;
};

const blogFrontmatterSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    /** Optional last-modified date. If absent, falls back to `date`. ISO 8601 format. */
    modified: z.string().optional(),
    ogImage: z.string().optional(),
    access_tier: z.enum(["public", "member", "premium"]).optional(),
    is_premium: z.boolean().optional(),
    slug: z.string().optional(),
    tags: z.array(z.string()).optional(),
    locale: z.string().optional(),
    heroPhotoCredit: z.string().optional(),
    heroNote: z.string().optional(),
    /** If true: exclude from sitemap + add `<meta name="robots" content="noindex">`. Used for stubs / thin posts. */
    noindex: z.boolean().optional(),
    /** Set by content-ops blog publish adapter; ignored for rendering. */
    template_version: z.string().optional(),
  })
  .strict();

/** Patterns that must not start the first prose block after the hero image (builder / ops memos). */
const BUILDER_MEMO_FIRST_BLOCK_RES: RegExp[] = [
  /^\s*\*?\s*photo\s*:/i,
  /^\s*\*?\s*original\s+hero\b/i,
  /^\s*\*?\s*사진\s*:/,
  /^\s*\*?\s*图片\s*：/,
  /^\s*\*?\s*圖片\s*：/,
  /^\s*\*?\s*写真\s*：/,
];

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SAMPLE_SLUG_RE = /^sample-/;

function shouldExcludeSlug(slug: string): boolean {
  if (!SAMPLE_SLUG_RE.test(slug)) return false;
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV;
  return env === "production";
}

/** Public URL path only — blocks `..` and protocol-relative URLs. */
function parseOgImage(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const t = value.trim();
  if (!t.startsWith("/") || t.includes("..") || t.includes("//"))
    return undefined;
  if (!/^\/[a-zA-Z0-9/_-]+\.[a-zA-Z0-9]+$/.test(t)) return undefined;
  return t;
}

function parseAccessTierFromParsed(
  data: z.infer<typeof blogFrontmatterSchema>,
): BlogPostMeta["accessTier"] {
  const raw = data.access_tier;
  if (raw === "public" || raw === "member" || raw === "premium") return raw;
  return data.is_premium === true ? "premium" : "public";
}

export function stripLeadingHeroImageMarkdown(body: string): string {
  let s = body.trim();
  let prev = "";
  while (s !== prev) {
    prev = s;
    s = s.replace(/^!\[[^\]]*]\([^)]+\)\s*\n?/, "").trim();
  }
  return s;
}

/**
 * Returns a short reason string if the first prose block after hero images looks like a builder memo
 * (photo credit / hero note that should live in frontmatter or image alt, not body copy).
 */
export function findBlogBodyBuilderMemoLeak(body: string): string | null {
  const afterHero = stripLeadingHeroImageMarkdown(body);
  if (!afterHero) return null;
  const firstBlock = (afterHero.split(/\n\s*\n/)[0] ?? "").trim();
  const firstLine = (firstBlock.split("\n")[0] ?? "").trim();
  const probe =
    firstLine.length > 0 ? firstLine : firstBlock.slice(0, 200).trim();
  for (const re of BUILDER_MEMO_FIRST_BLOCK_RES) {
    if (re.test(probe)) return re.source;
  }
  return null;
}

/**
 * Estimate reading time and word count from MDX body.
 * - English: ~200 words/min reader speed
 * - Korean (CJK): ~300 chars/min reader speed (different cognitive load per char)
 * Use word count for `wordCount` JSON-LD field regardless.
 */
function estimateReadingFromBody(
  body: string,
  locale: string,
): { readingMinutes: number; wordCount: number } {
  // Strip code blocks, MDX markdown syntax, image refs, then count
  const stripped = body
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[[^\]]*]\([^)]+\)/g, "") // image markdown
    .replace(/\[([^\]]+)]\([^)]+\)/g, "$1") // link markdown keep visible text
    .replace(/[#*_`>!\-\[\]()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // Word count (whitespace-split for both CJK + Latin scripts)
  const wordCount = stripped.split(/\s+/).filter(Boolean).length;

  // Reading time: CJK locales use char-based, others use word-based
  const isCjk = locale === "ko" || locale === "ja" || locale.startsWith("zh");
  const readingMinutes = isCjk
    ? Math.max(1, Math.ceil(stripped.replace(/\s+/g, "").length / 300))
    : Math.max(1, Math.ceil(wordCount / 200));

  return { readingMinutes, wordCount };
}

function parseFrontmatter(
  data: Record<string, unknown>,
  slug: string,
  body: string,
  locale: string,
): Omit<BlogPostMeta, "slug"> {
  const parsed = blogFrontmatterSchema.safeParse(data);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join(".") || "root"}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid blog frontmatter for "${slug}": ${detail}`);
  }
  const d = parsed.data;
  const accessTier = parseAccessTierFromParsed(d);
  const isPremium = accessTier === "premium";
  const ogImage = parseOgImage(d.ogImage);
  const heroPhotoCredit =
    typeof d.heroPhotoCredit === "string" && d.heroPhotoCredit.trim()
      ? d.heroPhotoCredit.trim()
      : undefined;
  const heroNote =
    typeof d.heroNote === "string" && d.heroNote.trim()
      ? d.heroNote.trim()
      : undefined;
  const { readingMinutes, wordCount } = estimateReadingFromBody(body, locale);
  const tags =
    Array.isArray(d.tags) && d.tags.length > 0
      ? d.tags.map((t) => String(t).trim()).filter(Boolean)
      : undefined;
  return {
    title: d.title,
    description: d.description,
    date: d.date,
    accessTier,
    isPremium,
    readingMinutes,
    wordCount,
    noindex: d.noindex === true,
    ...(d.modified ? { modified: d.modified } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(ogImage ? { ogImage } : {}),
    ...(heroPhotoCredit ? { heroPhotoCredit } : {}),
    ...(heroNote ? { heroNote } : {}),
  };
}

function listMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && SLUG_RE.test(f.replace(/\.mdx$/i, "")));
}

/**
 * Blog posts live under `content/blog/<locale>/<slug>.mdx` (e.g. `content/blog/en/prompt-harness-beats-prompt-hacks.mdx`).
 * Each locale has its own files—no fallback to English at runtime.
 * Sample posts (slug starting with "sample-") are excluded in production builds.
 */
export function getAllPostMetaForLocale(locale: string): BlogPostMeta[] {
  if (!ALLOWED_LOCALES.has(locale)) return [];
  const dir = path.join(BLOG_ROOT, locale);
  const posts: BlogPostMeta[] = [];
  for (const file of listMdxFiles(dir)) {
    const slug = file.replace(/\.mdx$/i, "");
    if (shouldExcludeSlug(slug)) continue;
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const { data, content } = matter(raw);
    const meta = parseFrontmatter(
      data as Record<string, unknown>,
      slug,
      content,
      locale,
    );
    posts.push({ slug, ...meta });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

/** Same as getAllPostMetaForLocale but EXCLUDES noindex posts (sitemap + feed filter). */
export function getIndexablePostMetaForLocale(locale: string): BlogPostMeta[] {
  return getAllPostMetaForLocale(locale).filter((p) => !p.noindex);
}

export function getPostBySlug(
  slug: string,
  locale: string,
): { meta: BlogPostMeta; body: string } | null {
  if (!SLUG_RE.test(slug) || !ALLOWED_LOCALES.has(locale)) return null;
  if (shouldExcludeSlug(slug)) return null;
  const filePath = path.join(BLOG_ROOT, locale, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const meta = parseFrontmatter(
    data as Record<string, unknown>,
    slug,
    content,
    locale,
  );
  return {
    meta: { slug, ...meta },
    body: content.trim(),
  };
}

/**
 * Related posts — same-locale + tag intersection score, exclude current + noindex.
 * Internal linking + bounce rate reduction.
 */
export function getRelatedPostsForLocale(
  currentSlug: string,
  locale: string,
  limit = 3,
): BlogPostMeta[] {
  const all = getIndexablePostMetaForLocale(locale);
  const current = all.find((p) => p.slug === currentSlug);
  if (!current) return [];

  const currentTags = new Set(current.tags ?? []);
  const candidates = all.filter((p) => p.slug !== currentSlug);

  if (currentTags.size === 0) {
    // No tags → newest N
    return candidates.slice(0, limit);
  }

  const scored = candidates
    .map((p) => {
      const tags = new Set(p.tags ?? []);
      const intersect = [...currentTags].filter((t) => tags.has(t)).length;
      return { post: p, score: intersect };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.post.date < a.post.date ? -1 : 1;
    });

  return scored.slice(0, limit).map((s) => s.post);
}

/** Get all unique tags across indexable posts for a locale (for tag pages). */
export function getAllTagsForLocale(locale: string): string[] {
  const all = getIndexablePostMetaForLocale(locale);
  const tags = new Set<string>();
  for (const p of all) {
    for (const tag of p.tags ?? []) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

export function getPostsByTagForLocale(
  tag: string,
  locale: string,
): BlogPostMeta[] {
  return getIndexablePostMetaForLocale(locale).filter((p) =>
    (p.tags ?? []).includes(tag),
  );
}
