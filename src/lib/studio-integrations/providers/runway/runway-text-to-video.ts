/**
 * Runway text-to-video via official SDK — server-only.
 */
import "server-only";

import RunwayML from "@runwayml/sdk";
import type { TextToVideoCreateParams } from "@runwayml/sdk/resources/text-to-video";
import { TaskFailedError, TaskTimedOutError } from "@runwayml/sdk";
import { RUNWAY_API_VERSION } from "@/lib/studio-integrations/runway-verify";
import {
  DEFAULT_RUNWAY_SCENE_MODEL,
  type RunwayTextToVideoModelId,
} from "./runway-scene-models";

export {
  RUNWAY_TEXT_TO_VIDEO_MODEL_IDS,
  DEFAULT_RUNWAY_SCENE_MODEL,
  parseRunwaySceneModelId,
  type RunwayTextToVideoModelId,
} from "./runway-scene-models";

export type RunwayTextToVideoParams = {
  /** Trimmed; truncated to 1000 UTF-16 code units per API. */
  promptText: string;
  /** Vertical short default. */
  ratio?: "1280:720" | "720:1280";
  /** gen4.5: integer 2–10 seconds; Veo models use 4/6/8 or fixed (veo3 → 8). */
  duration?: number;
  /** Defaults to gen4.5. */
  model?: RunwayTextToVideoModelId;
};

export type RunwayTextToVideoResult =
  | { ok: true; task_id: string; output_urls: string[] }
  | {
      ok: false;
      code:
        | "runway_empty_prompt"
        | "runway_task_failed"
        | "runway_timeout"
        | "runway_api_error"
        | "runway_insufficient_credits";
      message?: string;
    };

function clampGen45Duration(n: number): number {
  const x = Math.round(n);
  if (x < 2) return 2;
  if (x > 10) return 10;
  return x;
}

function pickVeo371Duration(seconds: number): 4 | 6 | 8 {
  const x = Math.round(seconds);
  if (x <= 4) return 4;
  if (x <= 6) return 6;
  return 8;
}

/** Map episode format ratio to Veo-supported HD presets. */
function mapRatioToVeo(
  formatRatio: "1280:720" | "720:1280",
): Exclude<TextToVideoCreateParams, TextToVideoCreateParams.Gen4_5>["ratio"] {
  return formatRatio === "720:1280" ? "1080:1920" : "1920:1080";
}

function buildCreateParams(
  model: RunwayTextToVideoModelId,
  promptText: string,
  formatRatio: "1280:720" | "720:1280",
  requestedSeconds: number,
): TextToVideoCreateParams {
  if (model === "gen4.5") {
    return {
      model: "gen4.5",
      promptText,
      ratio: formatRatio,
      duration: clampGen45Duration(requestedSeconds),
    };
  }
  if (model === "veo3") {
    return {
      model: "veo3",
      promptText,
      ratio: mapRatioToVeo(formatRatio),
      duration: 8,
    };
  }
  const ratio = mapRatioToVeo(formatRatio);
  const duration = pickVeo371Duration(requestedSeconds);
  if (model === "veo3.1") {
    return { model: "veo3.1", promptText, ratio, duration };
  }
  return { model: "veo3.1_fast", promptText, ratio, duration };
}

/** Public for unit tests — matches Runway prompt limits. */
export function slicePromptUtf16(s: string, maxCodeUnits: number): string {
  return [...s].slice(0, maxCodeUnits).join("");
}

function failureLooksLikeInsufficientCredits(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("credit") || m.includes("billing") || m.includes("quota");
}

/**
 * Create a text-to-video task and block until success or failure (SDK polling).
 * @param pollTimeoutMs — default 120s to stay within typical serverless limits.
 */
export async function runRunwayTextToVideo(
  apiKey: string,
  params: RunwayTextToVideoParams,
  options?: { pollTimeoutMs?: number },
): Promise<RunwayTextToVideoResult> {
  const key = apiKey.replace(/\s+/g, "").trim();
  if (!key) {
    return { ok: false, code: "runway_api_error", message: "missing_key" };
  }

  const promptText = slicePromptUtf16(params.promptText.trim(), 1000);
  if (!promptText) {
    return { ok: false, code: "runway_empty_prompt" };
  }

  const client = new RunwayML({
    apiKey: key,
    runwayVersion: RUNWAY_API_VERSION,
    maxRetries: 1,
  });

  const formatRatio = params.ratio ?? "720:1280";
  const model = params.model ?? DEFAULT_RUNWAY_SCENE_MODEL;
  const requestedSeconds = params.duration ?? (model === "veo3" ? 8 : 5);
  const createParams = buildCreateParams(model, promptText, formatRatio, requestedSeconds);

  try {
    const succeeded = await client.textToVideo
      .create(createParams)
      .waitForTaskOutput({
        timeout: options?.pollTimeoutMs ?? 120_000,
      });

    return {
      ok: true,
      task_id: succeeded.id,
      output_urls: succeeded.output,
    };
  } catch (e) {
    if (e instanceof TaskFailedError) {
      const d = e.taskDetails;
      const msg =
        "failure" in d && typeof d.failure === "string" ? d.failure : "task_failed";
      if (failureLooksLikeInsufficientCredits(msg)) {
        return { ok: false, code: "runway_insufficient_credits", message: msg };
      }
      return { ok: false, code: "runway_task_failed", message: msg };
    }
    if (e instanceof TaskTimedOutError) {
      return { ok: false, code: "runway_timeout" };
    }
    return { ok: false, code: "runway_api_error", message: String(e) };
  }
}
