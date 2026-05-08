import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getAllPostMetaForLocale } from "@/lib/blog/posts";

const LOCALES = ["en", "ko", "zh-CN", "zh-TW", "ja"] as const;

describe("sample-* posts production gate", () => {
  const originalEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    process.env.VERCEL_ENV = "production";
  });

  afterEach(() => {
    process.env.VERCEL_ENV = originalEnv;
  });

  it.each(LOCALES)(
    "excludes sample-* slugs in production for %s",
    (locale) => {
      const posts = getAllPostMetaForLocale(locale);
      const leaked = posts.filter((p) => p.slug.startsWith("sample-"));
      expect(leaked).toEqual([]);
    },
  );
});

describe("sample-* posts staging access", () => {
  const originalEnv = process.env.VERCEL_ENV;

  beforeEach(() => {
    process.env.VERCEL_ENV = "preview";
  });

  afterEach(() => {
    process.env.VERCEL_ENV = originalEnv;
  });

  it("lists normal posts in preview (sample-* fixtures are optional in repo)", () => {
    const posts = getAllPostMetaForLocale("en");
    expect(posts.some((p) => p.slug === "prompt-harness-beats-prompt-hacks")).toBe(
      true,
    );
  });
});
