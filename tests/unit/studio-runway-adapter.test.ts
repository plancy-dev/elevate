import { describe, expect, it } from "vitest";
import { runwayAdapter } from "@/lib/studio-integrations/providers/runway";

describe("runwayAdapter runStep", () => {
  it("returns runway_missing_prompt when prompt_text is absent", async () => {
    const r = await runwayAdapter.runStep?.("token", {});
    expect(r).toEqual({ ok: false, code: "runway_missing_prompt" });
  });
});
