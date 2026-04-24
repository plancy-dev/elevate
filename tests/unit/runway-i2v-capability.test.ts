import { describe, expect, it } from "vitest";
import {
  RUNWAY_I2V_MODELS,
  RUNWAY_I2V_MODEL_IDS,
  clampI2VDuration,
  isRunwayI2VModelId,
  parseRunwayI2VModelId,
  supportsLastFrame,
  DEFAULT_RUNWAY_I2V_MODEL,
} from "@/lib/studio-integrations/providers/runway/runway-i2v-models";

describe("Runway I2V capability table", () => {
  it("declares veo3.1 as default", () => {
    expect(DEFAULT_RUNWAY_I2V_MODEL).toBe("veo3.1");
  });

  it("lists the SDK-verified model ids only", () => {
    expect(new Set(RUNWAY_I2V_MODEL_IDS)).toEqual(
      new Set([
        "veo3.1",
        "veo3.1_fast",
        "gen3a_turbo",
        "gen4.5",
        "gen4_turbo",
        "veo3",
      ]),
    );
  });

  it("records supportsLastFrame per SDK spec", () => {
    expect(supportsLastFrame("veo3.1")).toBe(true);
    expect(supportsLastFrame("veo3.1_fast")).toBe(true);
    expect(supportsLastFrame("gen3a_turbo")).toBe(true);
    expect(supportsLastFrame("gen4.5")).toBe(false);
    expect(supportsLastFrame("gen4_turbo")).toBe(false);
    expect(supportsLastFrame("veo3")).toBe(false);
  });

  it("isRunwayI2VModelId narrows strings", () => {
    expect(isRunwayI2VModelId("veo3.1")).toBe(true);
    expect(isRunwayI2VModelId("not-a-model")).toBe(false);
  });

  it("parseRunwayI2VModelId falls back to default for unknown input", () => {
    expect(parseRunwayI2VModelId("bogus")).toBe(DEFAULT_RUNWAY_I2V_MODEL);
    expect(parseRunwayI2VModelId("gen3a_turbo")).toBe("gen3a_turbo");
  });

  it("clampI2VDuration snaps to the nearest allowed duration >= requested", () => {
    expect(clampI2VDuration("veo3.1", 5)).toBe(6);
    expect(clampI2VDuration("veo3.1", 9)).toBe(8); // max wins
    expect(clampI2VDuration("gen3a_turbo", 6)).toBe(10);
    expect(clampI2VDuration("gen4.5", 4)).toBe(4);
    expect(clampI2VDuration("veo3", 3)).toBe(8); // only 8
  });

  it("all models declare at least one allowed duration", () => {
    for (const id of RUNWAY_I2V_MODEL_IDS) {
      expect(RUNWAY_I2V_MODELS[id].allowedDurations.length).toBeGreaterThan(0);
    }
  });
});
