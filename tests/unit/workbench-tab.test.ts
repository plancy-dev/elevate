import { describe, expect, it } from "vitest";
import {
  LEGACY_WORKBENCH_TAB_QUERY,
  parseWorkbenchTabParam,
  resolveWorkbenchTabFromSearchParam,
  WORKBENCH_TAB_IDS,
} from "@/lib/studio-productions/workbench-tab";

describe("parseWorkbenchTabParam", () => {
  it("accepts known tab ids", () => {
    for (const id of WORKBENCH_TAB_IDS) {
      expect(parseWorkbenchTabParam(id)).toBe(id);
    }
  });

  it("returns null for unknown or empty", () => {
    expect(parseWorkbenchTabParam(null)).toBeNull();
    expect(parseWorkbenchTabParam("")).toBeNull();
    expect(parseWorkbenchTabParam("artifacts ")).toBeNull();
    expect(parseWorkbenchTabParam("prompts")).toBeNull();
  });

  it("maps legacy artifacts tab to episode", () => {
    expect(parseWorkbenchTabParam(LEGACY_WORKBENCH_TAB_QUERY)).toBe("episode");
  });
});

describe("resolveWorkbenchTabFromSearchParam", () => {
  it("defaults to overview", () => {
    expect(resolveWorkbenchTabFromSearchParam(null)).toBe("overview");
    expect(resolveWorkbenchTabFromSearchParam("")).toBe("overview");
    expect(resolveWorkbenchTabFromSearchParam("nope")).toBe("overview");
  });

  it("returns known tabs and maps legacy", () => {
    expect(resolveWorkbenchTabFromSearchParam("overview")).toBe("overview");
    expect(resolveWorkbenchTabFromSearchParam("episode")).toBe("episode");
    expect(resolveWorkbenchTabFromSearchParam(LEGACY_WORKBENCH_TAB_QUERY)).toBe(
      "episode",
    );
  });
});
