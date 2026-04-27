import { describe, expect, it } from "vitest";
import {
  RUNWAY_I2V_CREDITS_PER_SECOND_ESTIMATE,
  estimateRunwayI2VCreditsForDuration,
} from "@/lib/studio-integrations/providers/runway/runway-i2v-credits-estimate";

describe("estimateRunwayI2VCreditsForDuration", () => {
  it("uses ceil(duration * rate)", () => {
    const rate = RUNWAY_I2V_CREDITS_PER_SECOND_ESTIMATE["veo3.1"];
    expect(estimateRunwayI2VCreditsForDuration("veo3.1", 6)).toBe(
      Math.ceil(6 * rate),
    );
  });

  it("returns 0 for invalid duration", () => {
    expect(estimateRunwayI2VCreditsForDuration("gen4.5", NaN)).toBe(0);
  });
});
