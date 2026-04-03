import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { routing } from "@/i18n/routing";
import { getAllPostMetaForLocale, getPostBySlug } from "@/lib/blog/posts";

describe("blog posts (locale MDX)", () => {
  it("lists the same two slugs for every locale", () => {
    const expected = ["seo-and-waitlist", "welcome"].sort();
    for (const locale of routing.locales) {
      const slugs = getAllPostMetaForLocale(locale)
        .map((p) => p.slug)
        .sort();
      expect(slugs).toEqual(expected);
    }
  });

  it("loads body and meta for welcome in English", () => {
    const post = getPostBySlug("welcome", "en");
    expect(post).not.toBeNull();
    expect(post!.meta.title.length).toBeGreaterThan(0);
    expect(post!.body).toContain("Elevate");
  });

  it("returns null for unknown slug", () => {
    expect(getPostBySlug("no-such-post", "en")).toBeNull();
  });
});
