import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string;
  /** If set, post is only shown for this locale. If omitted, all locales. */
  locale?: string;
};

function parseFrontmatter(data: Record<string, unknown>, slug: string): Omit<BlogPostMeta, "slug"> {
  const title = typeof data.title === "string" ? data.title : slug;
  const description = typeof data.description === "string" ? data.description : "";
  const date =
    typeof data.date === "string"
      ? data.date
      : new Date().toISOString().slice(0, 10);
  const locale = typeof data.locale === "string" ? data.locale : undefined;
  return { title, description, date, locale };
}

export function getAllPostMetaForLocale(locale: string): BlogPostMeta[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".mdx"));
  const posts: BlogPostMeta[] = [];
  for (const file of files) {
    const slug = file.replace(/\.mdx$/i, "");
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) continue;
    const raw = fs.readFileSync(path.join(BLOG_DIR, file), "utf8");
    const { data } = matter(raw);
    const meta = parseFrontmatter(data as Record<string, unknown>, slug);
    if (meta.locale && meta.locale !== locale) continue;
    posts.push({ slug, ...meta });
  }
  posts.sort((a, b) => (a.date < b.date ? 1 : -1));
  return posts;
}

export function getPostBySlug(
  slug: string,
  locale: string,
): { meta: BlogPostMeta; body: string } | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filePath)) return null;
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const meta = parseFrontmatter(data as Record<string, unknown>, slug);
  if (meta.locale && meta.locale !== locale) return null;
  return {
    meta: { slug, ...meta },
    body: content.trim(),
  };
}
