import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "../../messages");

/** MICE legacy terms that must not appear in user-facing blog content */
const MICE_LEGACY_PATTERNS = [
  /event communications?/i,
  /events and sessions/i,
  /meetings,?\s*events/i,
  /イベント[・･]現場コミュニケーション/i,
  /活動[／/]現場溝通/i,
  /행사[·・･]현장\s*커뮤니케이션/i,
] as const;

function loadLocaleMessages(locale: string): Record<string, unknown> {
  const raw = readFileSync(join(messagesDir, `${locale}.json`), "utf8");
  return JSON.parse(raw) as Record<string, unknown>;
}

describe("Blog tagline MICE legacy guard", () => {
  const locales = ["en", "ko", "ja", "zh-CN", "zh-TW"] as const;

  it.each(locales)(
    "%s blog tagline must not contain MICE legacy terms",
    (locale) => {
      const messages = loadLocaleMessages(locale);
      const blogSection = (messages as { Blog?: { description?: string } }).Blog;

      expect(
        blogSection,
        `Blog section missing in ${locale}.json`,
      ).toBeDefined();
      expect(
        blogSection?.description,
        `Blog.description missing in ${locale}.json`,
      ).toBeDefined();

      const description = blogSection?.description ?? "";

      for (const pattern of MICE_LEGACY_PATTERNS) {
        expect(
          description,
          `${locale}.json Blog.description contains MICE legacy term matching ${pattern}`,
        ).not.toMatch(pattern);
      }
    },
  );
});
