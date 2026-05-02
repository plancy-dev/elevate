import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
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
};

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

function parseAccessTier(
  data: Record<string, unknown>,
): BlogPostMeta["accessTier"] {
  const raw = data.access_tier;
  if (raw === "public" || raw === "member" || raw === "premium") return raw;
  return data.is_premium === true ? "premium" : "public";
}

function parseFrontmatter(
  data: Record<string, unknown>,
  slug: string,
): Omit<BlogPostMeta, "slug"> {
  const title = typeof data.title === "string" ? data.title : slug;
  const description = typeof data.description === "string" ? data.description : "";
  const date =
    typeof data.date === "string"
      ? data.date
      : new Date().toISOString().slice(0, 10);
  const accessTier = parseAccessTier(data);
  const isPremium = accessTier === "premium";
  const ogImage = parseOgImage(data.ogImage);
  return {
    title,
    description,
    date,
    accessTier,
    isPremium,
    ...(ogImage ? { ogImage } : {}),
  };
}

function listMdxFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx") && SLUG_RE.test(f.replace(/\.mdx$/i, "")));
}

/**
 * Blog posts live under `content/blog/<locale>/<slug>.mdx` (e.g. `content/blog/en/the-prompt-is-your-product-surface.mdx`).
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
