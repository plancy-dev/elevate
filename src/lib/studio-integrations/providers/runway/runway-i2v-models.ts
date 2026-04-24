/**
 * Runway image-to-video model capability table (ADR-009 §7).
 *
 * This is the single source of truth for which I2V models accept a Last Frame
 * via the structured `promptImage` array. When Runway adds last-frame support
 * to more models, update this table — the adapter and UI will pick it up
 * without any other change.
 *
 * Source: `@runwayml/sdk/resources/image-to-video.d.ts` (verified 2026-04).
 */

export const RUNWAY_I2V_MODEL_IDS = [
  "veo3.1",
  "veo3.1_fast",
  "gen3a_turbo",
  "gen4.5",
  "gen4_turbo",
  "veo3",
] as const;

export type RunwayI2VModelId = (typeof RUNWAY_I2V_MODEL_IDS)[number];

export type RunwayI2VCapability = {
  supportsLastFrame: boolean;
  defaultDurationSec: number;
  /** Allowed duration values (seconds). Use first when in doubt. */
  allowedDurations: readonly number[];
};

export const RUNWAY_I2V_MODELS: Record<RunwayI2VModelId, RunwayI2VCapability> = {
  "veo3.1": {
    supportsLastFrame: true,
    defaultDurationSec: 6,
    allowedDurations: [4, 6, 8] as const,
  },
  "veo3.1_fast": {
    supportsLastFrame: true,
    defaultDurationSec: 6,
    allowedDurations: [4, 6, 8] as const,
  },
  gen3a_turbo: {
    supportsLastFrame: true,
    defaultDurationSec: 5,
    allowedDurations: [5, 10] as const,
  },
  "gen4.5": {
    supportsLastFrame: false,
    defaultDurationSec: 5,
    allowedDurations: [2, 3, 4, 5, 6, 7, 8, 9, 10] as const,
  },
  gen4_turbo: {
    supportsLastFrame: false,
    defaultDurationSec: 5,
    allowedDurations: [5, 10] as const,
  },
  veo3: {
    supportsLastFrame: false,
    defaultDurationSec: 8,
    allowedDurations: [8] as const,
  },
};

export const DEFAULT_RUNWAY_I2V_MODEL: RunwayI2VModelId = "veo3.1";

export function isRunwayI2VModelId(v: unknown): v is RunwayI2VModelId {
  return (
    typeof v === "string" &&
    (RUNWAY_I2V_MODEL_IDS as readonly string[]).includes(v)
  );
}

export function parseRunwayI2VModelId(v: unknown): RunwayI2VModelId {
  return isRunwayI2VModelId(v) ? v : DEFAULT_RUNWAY_I2V_MODEL;
}

export function supportsLastFrame(model: RunwayI2VModelId): boolean {
  return RUNWAY_I2V_MODELS[model].supportsLastFrame;
}

export function clampI2VDuration(
  model: RunwayI2VModelId,
  requestedSeconds: number,
): number {
  const cap = RUNWAY_I2V_MODELS[model];
  const x = Math.round(requestedSeconds);
  // Pick the closest allowed duration (first >= x, else max).
  for (const d of cap.allowedDurations) {
    if (x <= d) return d;
  }
  return cap.allowedDurations[cap.allowedDurations.length - 1];
}
