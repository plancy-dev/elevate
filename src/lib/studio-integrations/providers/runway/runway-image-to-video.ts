/**
 * Runway image-to-video adapter (ADR-009 §7) — server-only.
 *
 * Wraps the Runway SDK `imageToVideo.create().waitForTaskOutput()` flow. The
 * capability table (`runway-i2v-models.ts`) decides whether the `lastFrameUrl`
 * is sent as a structured `promptImage[{position:"last"}]` array item or
 * merged into the prompt text as an end-state description.
 */
import "server-only";

import RunwayML from "@runwayml/sdk";
import type { ImageToVideoCreateParams } from "@runwayml/sdk/resources/image-to-video";
import { TaskFailedError, TaskTimedOutError } from "@runwayml/sdk";
import { RUNWAY_API_VERSION } from "@/lib/studio-integrations/runway-verify";
import {
  DEFAULT_RUNWAY_I2V_MODEL,
  RUNWAY_I2V_MODELS,
  clampI2VDuration,
  type RunwayI2VModelId,
} from "./runway-i2v-models";
import { slicePromptUtf16 } from "./runway-text-to-video";

export type RunwayI2VRatio =
  | "720:1280"
  | "1280:720"
  | "1080:1920"
  | "1920:1080";

export type RunwayI2VParams = {
  promptText: string;
  firstFrameUrl: string;
  lastFrameUrl?: string;
  ratio: RunwayI2VRatio;
  model?: RunwayI2VModelId;
  durationSec?: number;
};

export type RunwayI2VResult =
  | { ok: true; task_id: string; output_urls: string[] }
  | {
      ok: false;
      code:
        | "runway_i2v_missing_first_frame"
        | "runway_i2v_empty_prompt"
        | "runway_i2v_task_failed"
        | "runway_i2v_timeout"
        | "runway_i2v_api_error"
        | "runway_i2v_insufficient_credits";
      message?: string;
    };

function failureLooksLikeInsufficientCredits(msg: string): boolean {
  const m = msg.toLowerCase();
  return m.includes("credit") || m.includes("billing") || m.includes("quota");
}

function mapRatioForModel(
  model: RunwayI2VModelId,
  ratio: RunwayI2VRatio,
): string {
  // gen3a_turbo uses its own 768/1280 grid; use SDK-compatible values.
  if (model === "gen3a_turbo") {
    return ratio === "1280:720" || ratio === "1920:1080"
      ? "1280:768"
      : "768:1280";
  }
  // gen4.5 / gen4_turbo accept the base 1280:720 / 720:1280 grid.
  if (model === "gen4.5" || model === "gen4_turbo") {
    return ratio === "1280:720" || ratio === "1920:1080"
      ? "1280:720"
      : "720:1280";
  }
  // Veo family accepts HD/FHD directly; promote 720 → 1920 for Veo3/Veo3.1
  // to match the SDK ratio union.
  if (model === "veo3" || model === "veo3.1" || model === "veo3.1_fast") {
    if (ratio === "720:1280") return "1080:1920";
    if (ratio === "1280:720") return "1920:1080";
    return ratio;
  }
  return ratio;
}

function buildCreateParams(
  model: RunwayI2VModelId,
  promptText: string,
  firstFrameUrl: string,
  lastFrameUrl: string | undefined,
  ratio: RunwayI2VRatio,
  durationSec: number,
): ImageToVideoCreateParams {
  const cap = RUNWAY_I2V_MODELS[model];
  const useArray = cap.supportsLastFrame && !!lastFrameUrl;
  const mappedRatio = mapRatioForModel(model, ratio);
  const clampedDuration = clampI2VDuration(model, durationSec);

  if (model === "veo3.1") {
    return {
      model: "veo3.1",
      promptImage: useArray
        ? [
            { position: "first", uri: firstFrameUrl },
            { position: "last", uri: lastFrameUrl! },
          ]
        : firstFrameUrl,
      promptText,
      ratio: mappedRatio as ImageToVideoCreateParams.Veo3_1["ratio"],
      duration: clampedDuration as ImageToVideoCreateParams.Veo3_1["duration"],
    };
  }
  if (model === "veo3.1_fast") {
    return {
      model: "veo3.1_fast",
      promptImage: useArray
        ? [
            { position: "first", uri: firstFrameUrl },
            { position: "last", uri: lastFrameUrl! },
          ]
        : firstFrameUrl,
      promptText,
      ratio: mappedRatio as ImageToVideoCreateParams.Veo3_1Fast["ratio"],
      duration:
        clampedDuration as ImageToVideoCreateParams.Veo3_1Fast["duration"],
    };
  }
  if (model === "veo3") {
    return {
      model: "veo3",
      promptImage: firstFrameUrl,
      promptText,
      ratio: mappedRatio as ImageToVideoCreateParams.Veo3["ratio"],
      duration: 8,
    };
  }
  if (model === "gen3a_turbo") {
    return {
      model: "gen3a_turbo",
      promptImage: useArray
        ? [
            { position: "first", uri: firstFrameUrl },
            { position: "last", uri: lastFrameUrl! },
          ]
        : firstFrameUrl,
      promptText,
      ratio: mappedRatio as ImageToVideoCreateParams.Gen3aTurbo["ratio"],
      duration: (clampedDuration === 10
        ? 10
        : 5) as ImageToVideoCreateParams.Gen3aTurbo["duration"],
    };
  }
  if (model === "gen4_turbo") {
    return {
      model: "gen4_turbo",
      promptImage: firstFrameUrl,
      promptText,
      ratio: mappedRatio as ImageToVideoCreateParams.Gen4Turbo["ratio"],
      duration: clampedDuration,
    };
  }
  return {
    model: "gen4.5",
    promptImage: firstFrameUrl,
    promptText,
    ratio: mappedRatio as ImageToVideoCreateParams.Gen4_5["ratio"],
    duration: clampedDuration,
  };
}

export async function runRunwayImageToVideo(
  apiKey: string,
  params: RunwayI2VParams,
  options?: { pollTimeoutMs?: number },
): Promise<RunwayI2VResult> {
  const key = apiKey.replace(/\s+/g, "").trim();
  if (!key) {
    return { ok: false, code: "runway_i2v_api_error", message: "missing_key" };
  }
  if (!params.firstFrameUrl) {
    return { ok: false, code: "runway_i2v_missing_first_frame" };
  }
  const promptText = slicePromptUtf16(params.promptText.trim(), 1000);
  if (!promptText) {
    return { ok: false, code: "runway_i2v_empty_prompt" };
  }

  const model = params.model ?? DEFAULT_RUNWAY_I2V_MODEL;
  const ratio = params.ratio;
  const durationSec =
    params.durationSec ?? RUNWAY_I2V_MODELS[model].defaultDurationSec;

  const createParams = buildCreateParams(
    model,
    promptText,
    params.firstFrameUrl,
    params.lastFrameUrl,
    ratio,
    durationSec,
  );

  const client = new RunwayML({
    apiKey: key,
    runwayVersion: RUNWAY_API_VERSION,
    maxRetries: 1,
  });

  try {
    const succeeded = await client.imageToVideo
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
        "failure" in d && typeof d.failure === "string"
          ? d.failure
          : "task_failed";
      if (failureLooksLikeInsufficientCredits(msg)) {
        return {
          ok: false,
          code: "runway_i2v_insufficient_credits",
          message: msg,
        };
      }
      return { ok: false, code: "runway_i2v_task_failed", message: msg };
    }
    if (e instanceof TaskTimedOutError) {
      return { ok: false, code: "runway_i2v_timeout" };
    }
    // Runway's preflight validation (createTask) can 400 with
    // `{"error":"You do not have enough credits to run this task."}` before
    // the polling loop even starts. The SDK surfaces that as a BadRequestError
    // whose `.message` contains the string. Check both shapes.
    const rawMsg = e instanceof Error ? e.message : String(e);
    if (failureLooksLikeInsufficientCredits(rawMsg)) {
      return {
        ok: false,
        code: "runway_i2v_insufficient_credits",
        message: rawMsg,
      };
    }
    return {
      ok: false,
      code: "runway_i2v_api_error",
      message: rawMsg,
    };
  }
}
