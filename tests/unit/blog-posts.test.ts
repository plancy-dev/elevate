import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { routing } from "@/i18n/routing";
import { getAllPostMetaForLocale, getPostBySlug } from "@/lib/blog/posts";

/** en: pipeline-published longform (+ en-only slug). ko: harness + direction posts. ja/zh: welcome + SEO slice (no en-only slugs). */
const EN_SLUGS = [
  "cursor-session-discipline-that-ships",
  "elevate-first-vertical-content-focus",
  "operator-grade-execution-moat-for-ai-enabled-teams-from-signal-to-operating-adva",
  "prompt-harness-beats-prompt-hacks",
  "the-60-minute-boardroom",
].sort();
const KO_SLUGS = [
  "cursor-session-discipline-that-ships",
  "elevate-first-vertical-content-focus",
  "prompt-harness-beats-prompt-hacks",
].sort();
const JA_ZH_SLUGS = ["seo-and-waitlist", "welcome"].sort();

describe("blog posts (locale MDX)", () => {
  it("lists expected slugs per locale (en+ko vs ja/zh)", () => {
    for (const locale of routing.locales) {
      const slugs = getAllPostMetaForLocale(locale)
        .map((p) => p.slug)
        .sort();
      const expected =
        locale === "en"
          ? EN_SLUGS
          : locale === "ko"
            ? KO_SLUGS
            : JA_ZH_SLUGS;
      expect(slugs).toEqual(expected);
    }
  });

  it("loads body and meta for English longform (prompt harness)", () => {
    const post = getPostBySlug("prompt-harness-beats-prompt-hacks", "en");
    expect(post).not.toBeNull();
    expect(post!.meta.title.length).toBeGreaterThan(0);
    expect(post!.meta.ogImage).toBeUndefined();
    expect(post!.body).toContain("Prompt hacks");
  });

  it("loads Korean prompt harness post", () => {
    const post = getPostBySlug("prompt-harness-beats-prompt-hacks", "ko");
    expect(post).not.toBeNull();
    expect(post!.body).toContain("하네스");
  });

  it("returns null for unknown slug", () => {
    expect(getPostBySlug("no-such-post", "en")).toBeNull();
  });
});
