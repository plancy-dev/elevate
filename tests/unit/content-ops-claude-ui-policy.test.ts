import { describe, expect, it } from "vitest";
import { parseContentOpsClaudeWhenGatePassedEnabled } from "@/lib/content-ops/claude-ui-policy";

describe("parseContentOpsClaudeWhenGatePassedEnabled", () => {
  it("defaults true when unset or empty", () => {
    expect(parseContentOpsClaudeWhenGatePassedEnabled(undefined)).toBe(true);
    expect(parseContentOpsClaudeWhenGatePassedEnabled("")).toBe(true);
  });

  it("is false for false / 0 / no (case-insensitive)", () => {
    expect(parseContentOpsClaudeWhenGatePassedEnabled("false")).toBe(false);
    expect(parseContentOpsClaudeWhenGatePassedEnabled("FALSE")).toBe(false);
    expect(parseContentOpsClaudeWhenGatePassedEnabled("0")).toBe(false);
    expect(parseContentOpsClaudeWhenGatePassedEnabled("no")).toBe(false);
  });

  it("is true for other truthy strings", () => {
    expect(parseContentOpsClaudeWhenGatePassedEnabled("true")).toBe(true);
    expect(parseContentOpsClaudeWhenGatePassedEnabled("1")).toBe(true);
    expect(parseContentOpsClaudeWhenGatePassedEnabled("yes")).toBe(true);
  });
});
