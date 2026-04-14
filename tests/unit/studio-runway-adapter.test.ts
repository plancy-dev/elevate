import { describe, expect, it } from "vitest";
import { runwayAdapter } from "@/lib/studio-integrations/providers/runway";

describe("runwayAdapter stub", () => {
  it("runStep returns not_implemented", async () => {
    const r = await runwayAdapter.runStep?.("token", {});
    expect(r).toEqual({ ok: false, code: "not_implemented" });
  });
});
