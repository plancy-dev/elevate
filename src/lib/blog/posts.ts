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
  accessTier: "public" | "member" | "premium";
  isPremium: boolean;
  /** Absolute path from site root for OG/Twitter preview, e.g. `/blog/my-slug/hero.jpg`. Must live under `public/`. */
  ogImage?: string;
  /** Optional credit line for the hero (keep out of MDX body—use meta or image `alt` only). */
  heroPhotoCredit?: string;
  /** Optional internal editorial note for the hero (not rendered as article prose). */
  heroNote?: string;
};

const blogFrontmatterSchema = z
  .object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    ogImage: z.string().optional(),
    access_tier: z.enum(["public", "member", "premium"]).optional(),
    is_premium: z.boolean().optional(),
    slug: z.string().optional(),
    tags: z.array(z.string()).optional(),
    locale: z.string().optional(),
    heroPhotoCredit: z.string().optional(),
    heroNote: z.string().optional(),
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

function parseFrontmatter(
  data: Record<string, unknown>,
  slug: string,
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
  return {
    title: d.title,
    description: d.description,
    date: d.date,
    accessTier,
    isPremium,
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
    const { data } = matter(raw);
    const meta = parseFrontmatter(data as Record<string, unknown>, slug);
    posts.push({ slug, ...meta });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
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
  const meta = parseFrontmatter(data as Record<string, unknown>, slug);
  return {
    meta: { slug, ...meta },
    body: content.trim(),
  };
}
