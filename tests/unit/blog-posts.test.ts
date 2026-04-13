import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { routing } from "@/i18n/routing";
import { getAllPostMetaForLocale, getPostBySlug } from "@/lib/blog/posts";

/** Locales with en+ko-first flagship blog; others keep legacy sample slugs until localized. */
const FLAGSHIP_LOCALES = new Set(["en", "ko"]);

describe("blog posts (locale MDX)", () => {
  it("lists expected slugs per locale (en+ko flagship vs legacy samples)", () => {
    const flagship = ["release-0-2-0", "the-prompt-is-your-product-surface"].sort();
    const legacy = ["seo-and-waitlist", "welcome"].sort();
    for (const locale of routing.locales) {
      const slugs = getAllPostMetaForLocale(locale)
        .map((p) => p.slug)
        .sort();
      expect(slugs).toEqual(FLAGSHIP_LOCALES.has(locale) ? flagship : legacy);
    }
  });

  it("loads body and meta for flagship post in English", () => {
    const post = getPostBySlug("the-prompt-is-your-product-surface", "en");
    expect(post).not.toBeNull();
    expect(post!.meta.title.length).toBeGreaterThan(0);
    expect(post!.meta.ogImage).toBe(
      "/blog/the-prompt-is-your-product-surface/hero.jpg",
    );
    expect(post!.body).toContain("Prompt Studio");
    expect(post!.body).toContain("/blog/the-prompt-is-your-product-surface/hero.jpg");
  });

  it("loads Korean flagship post", () => {
    const post = getPostBySlug("the-prompt-is-your-product-surface", "ko");
    expect(post).not.toBeNull();
    expect(post!.body).toContain("Prompt Studio");
  });

  it("loads v0.2.0 release posts (en + ko)", () => {
    const en = getPostBySlug("release-0-2-0", "en");
    const ko = getPostBySlug("release-0-2-0", "ko");
    expect(en).not.toBeNull();
    expect(ko).not.toBeNull();
    expect(en!.meta.ogImage).toBe("/blog/release-0-2-0/hero.jpg");
    expect(en!.body).toContain("0.2.0");
    expect(ko!.body).toContain("0.2.0");
  });

  it("returns null for unknown slug", () => {
    expect(getPostBySlug("no-such-post", "en")).toBeNull();
  });
});
