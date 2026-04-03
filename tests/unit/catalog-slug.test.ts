import { describe, expect, it } from "vitest";
import { isValidCatalogSlug } from "@/lib/content/catalog-slug";

describe("isValidCatalogSlug", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(isValidCatalogSlug("example-ebook")).toBe(true);
    expect(isValidCatalogSlug("a")).toBe(true);
  });

  it("rejects empty, uppercase, spaces, and path segments", () => {
    expect(isValidCatalogSlug("")).toBe(false);
    expect(isValidCatalogSlug("Example")).toBe(false);
    expect(isValidCatalogSlug("foo bar")).toBe(false);
    expect(isValidCatalogSlug("foo/bar")).toBe(false);
    expect(isValidCatalogSlug("foo..bar")).toBe(false);
  });
});
