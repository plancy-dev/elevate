import type { RunwayI2VModelId } from "./runway-i2v-models";

/**
 * Illustrative credits/sec estimates for I2V preflight checks.
 * Keep these conservative and calibrate against Runway billing docs/dashboard.
 */
export const RUNWAY_I2V_CREDITS_PER_SECOND_ESTIMATE: Record<
  RunwayI2VModelId,
  number
> = {
  "veo3.1": 8,
  "veo3.1_fast": 6,
  gen3a_turbo: 5,
  "gen4.5": 5,
  gen4_turbo: 5,
  veo3: 7,
};

export function estimateRunwayI2VCreditsForDuration(
  modelId: RunwayI2VModelId,
  durationSeconds: number,
): number {
  const rate = RUNWAY_I2V_CREDITS_PER_SECOND_ESTIMATE[modelId];
  const sec = Math.max(0, Number(durationSeconds) || 0);
  return Math.ceil(sec * rate);
}
