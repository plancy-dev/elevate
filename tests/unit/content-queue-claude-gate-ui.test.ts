import { describe, expect, it } from "vitest";
import { gatePassedPropForClaudeForms } from "@/lib/admin/content-queue-metadata";

/** PLAN-content-queue-claude-gate-ux §8 (metadata branches) + §1 conservative default. */
describe("gatePassedPropForClaudeForms", () => {
  it("treats missing review_gate as null (primary UI)", () => {
    expect(gatePassedPropForClaudeForms(null)).toBeNull();
    expect(gatePassedPropForClaudeForms({})).toBeNull();
    expect(gatePassedPropForClaudeForms({ review_gate: {} })).toBeNull();
  });

  it("uses passed true → advanced UI", () => {
    expect(
      gatePassedPropForClaudeForms({
        review_gate: { latest: { passed: true, reasons: [], metrics: { qualityScore: 1 } } },
      }),
    ).toBe(true);
  });

  it("uses passed false → primary UI", () => {
    expect(
      gatePassedPropForClaudeForms({
        review_gate: {
          latest: { passed: false, reasons: ["weak_citation"], metrics: { qualityScore: 0 } },
        },
      }),
    ).toBe(false);
  });

  it("treats non-boolean passed as not advanced (primary)", () => {
    expect(
      gatePassedPropForClaudeForms({
        review_gate: { latest: { passed: "yes" as unknown as boolean, reasons: [] } },
      }),
    ).toBe(false);
  });
});
