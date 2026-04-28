import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { routing } from "@/i18n/routing";
import { getAllPostMetaForLocale, getPostBySlug } from "@/lib/blog/posts";

/** en+ko: release note + flagship + access-tier sample posts. ja/zh: flagship translation + legacy samples (no release MDX yet). */
const EN_KO_SLUGS = [
  "release-0-2-0",
  "sample-member-account-required",
  "sample-premium-subscriber-only",
  "sample-public-open-notes",
  "the-prompt-is-your-product-surface",
].sort();
const JA_ZH_SLUGS = ["seo-and-waitlist", "the-prompt-is-your-product-surface", "welcome"].sort();

describe("blog posts (locale MDX)", () => {
  it("lists expected slugs per locale (en+ko flagship vs ja/zh flagship + samples)", () => {
    for (const locale of routing.locales) {
      const slugs = getAllPostMetaForLocale(locale)
        .map((p) => p.slug)
        .sort();
      const expected = locale === "en" || locale === "ko" ? EN_KO_SLUGS : JA_ZH_SLUGS;
      expect(slugs).toEqual(expected);
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
