import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));
const messagesDir = join(__dirname, "../../messages");

/**
 * Design system meta vocabulary that should never appear in user-facing copy.
 * These terms are for builders/designers, not end users.
 */
const FORBIDDEN_META_VOCABULARY = [
  // Design system references
  "Pretext",
  "pretext",
  "(Pretext)",
  "（Pretext）",
  
  // Technical design terms
  "Headlines stay balanced",
  "見出しのバランスが保たれ",
  "헤드라인 균형이 유지",
  "标题仍保持平衡",
  "標題仍保持平衡",
  
  // Reflow/resize instructions
  "smooth reflow",
  "スムーズなリフロー",
  "부드러운 리플로우",
  "顺滑重排",
  "順暢重排",
  "resize the window",
  "ウィンドウを変えて",
  "창 크기를 바꿔",
  "拖动窗口",
  "拖曳視窗",
] as const;

function loadJson(name: string): unknown {
  const raw = readFileSync(join(messagesDir, name), "utf8");
  return JSON.parse(raw) as unknown;
}

/** Recursively collect all string values from a nested object */
function collectAllStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (value === null || typeof value !== "object") {
    return [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectAllStrings);
  }
  return Object.values(value as Record<string, unknown>).flatMap(collectAllStrings);
}

describe("messages meta vocabulary guard (no builder jargon in user copy)", () => {
  const locales = ["en.json", "ko.json", "ja.json", "zh-CN.json", "zh-TW.json"] as const;

  it.each(locales)(
    "%s does not contain forbidden design meta vocabulary",
    (file) => {
      const data = loadJson(file) as Record<string, unknown>;
      const allStrings = collectAllStrings(data);
      const fullText = allStrings.join("\n");

      const violations: Array<{ term: string; found: string }> = [];

      for (const term of FORBIDDEN_META_VOCABULARY) {
        if (fullText.includes(term)) {
          // Find which string(s) contain this term
          const matches = allStrings.filter((s) => s.includes(term));
          matches.forEach((match) => {
            violations.push({ term, found: match });
          });
        }
      }

      if (violations.length > 0) {
        const report = violations
          .map(({ term, found }) => `  - Term: "${term}"\n    Found in: "${found}"`)
          .join("\n");
        throw new Error(
          `Found ${violations.length} forbidden meta vocabulary term(s) in ${file}:\n${report}`,
        );
      }

      expect(violations).toHaveLength(0);
    },
  );

  it("guard list is not empty", () => {
    expect(FORBIDDEN_META_VOCABULARY.length).toBeGreaterThan(0);
  });
});
