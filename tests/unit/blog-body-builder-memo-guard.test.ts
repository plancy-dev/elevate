import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { routing } from "@/i18n/routing";
import {
  findBlogBodyBuilderMemoLeak,
  getAllPostMetaForLocale,
  getPostBySlug,
} from "@/lib/blog/posts";

describe("blog body builder memo guard", () => {
  it("flags known leak patterns on synthetic bodies", () => {
    expect(
      findBlogBodyBuilderMemoLeak(`![alt](/x.jpg)\n\n*Photo: Stock image*`),
    ).toBeTruthy();
    expect(
      findBlogBodyBuilderMemoLeak(`![alt](/x.jpg)\n\n*Original hero for this release*`),
    ).toBeTruthy();
  });

  it("has no builder memo first block on any indexed blog post", () => {
    for (const locale of routing.locales) {
      for (const { slug } of getAllPostMetaForLocale(locale)) {
        const post = getPostBySlug(slug, locale);
        expect(post).not.toBeNull();
        const leak = findBlogBodyBuilderMemoLeak(post!.body);
        expect(
          leak,
          `${locale}/${slug}: builder memo leak (${leak})`,
        ).toBeNull();
      }
    }
  });
});
