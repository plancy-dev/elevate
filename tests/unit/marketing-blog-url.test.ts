import { describe, expect, it } from "vitest";
import {
  extractLocHrefsFromSitemapXml,
  parseMarketingBlogPathname,
} from "@/lib/blog/marketing-blog-url";

describe("parseMarketingBlogPathname", () => {
  it("parses default-locale EN path without prefix", () => {
    expect(parseMarketingBlogPathname("/blog/my-post")).toEqual({
      locale: "en",
      slug: "my-post",
    });
  });

  it("parses prefixed locale paths", () => {
    expect(parseMarketingBlogPathname("/ko/blog/my-post")).toEqual({
      locale: "ko",
      slug: "my-post",
    });
    expect(parseMarketingBlogPathname("/zh-CN/blog/welcome")).toEqual({
      locale: "zh-CN",
      slug: "welcome",
    });
  });

  it("strips trailing slash", () => {
    expect(parseMarketingBlogPathname("/blog/a-b-c/")).toEqual({
      locale: "en",
      slug: "a-b-c",
    });
  });

  it("returns null for non-blog paths", () => {
    expect(parseMarketingBlogPathname("/blog")).toBeNull();
    expect(parseMarketingBlogPathname("/pricing")).toBeNull();
    expect(parseMarketingBlogPathname("/ko/blog")).toBeNull();
  });
});

describe("extractLocHrefsFromSitemapXml", () => {
  it("collects loc hrefs in order", () => {
    const xml = `<?xml version="1.0"?><urlset>
    <loc>https://x.com/blog/a</loc>
    <loc>https://x.com/ko/blog/b</loc>
    </urlset>`;
    expect(extractLocHrefsFromSitemapXml(xml)).toEqual([
      "https://x.com/blog/a",
      "https://x.com/ko/blog/b",
    ]);
  });
});
