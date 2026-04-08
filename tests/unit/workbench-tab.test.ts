import { describe, expect, it } from "vitest";
import {
  parseWorkbenchTabParam,
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
});
