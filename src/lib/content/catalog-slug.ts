/** Matches `content_products.slug` style (lowercase, hyphenated). */
export const CATALOG_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidCatalogSlug(slug: string): boolean {
  return CATALOG_SLUG_RE.test(slug);
}
