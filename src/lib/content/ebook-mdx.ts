import "server-only";
import fs from "node:fs";
import path from "node:path";
import { isValidCatalogSlug } from "@/lib/content/catalog-slug";

const EBOOK_ROOT = path.join(process.cwd(), "content/ebooks");

/**
 * Server-only MDX source for in-app ebook reader (`content/ebooks/<slug>/index.mdx`).
 */
export function loadEbookMdxSource(slug: string): string | null {
  if (!isValidCatalogSlug(slug)) return null;
  const file = path.join(EBOOK_ROOT, slug, "index.mdx");
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, "utf8");
}
