import { describe, expect, it } from "vitest";
import { stripOuterMarkdownFence, truncateForClaudeInput } from "@/lib/content-ops/claude-content-queue";

describe("claude-content-queue helpers", () => {
  it("stripOuterMarkdownFence removes a single fence", () => {
    const raw = "```markdown\n# Hi\n\nBody\n```";
    expect(stripOuterMarkdownFence(raw)).toBe("# Hi\n\nBody");
  });

  it("truncateForClaudeInput marks truncation", () => {
    const long = "x".repeat(120_000);
    const r = truncateForClaudeInput(long, 100);
    expect(r.truncated).toBe(true);
    expect(r.text.length).toBeLessThan(long.length);
  });
});
