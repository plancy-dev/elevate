/**
 * Runway text-to-video (gen4.5) via official SDK — server-only.
 */
import "server-only";

import RunwayML from "@runwayml/sdk";
import { TaskFailedError, TaskTimedOutError } from "@runwayml/sdk";
import { RUNWAY_API_VERSION } from "@/lib/studio-integrations/runway-verify";

export type RunwayTextToVideoParams = {
  /** Trimmed; truncated to 1000 UTF-16 code units per API. */
  promptText: string;
  /** Vertical short default. */
  ratio?: "1280:720" | "720:1280";
  /** gen4.5: integer 2–10 seconds. */
  duration?: number;
};

export type RunwayTextToVideoResult =
  | { ok: true; task_id: string; output_urls: string[] }
  | {
      ok: false;
      code: "runway_empty_prompt" | "runway_task_failed" | "runway_timeout" | "runway_api_error";
      message?: string;
    };

function clampGen45Duration(n: number): number {
  const x = Math.round(n);
  if (x < 2) return 2;
  if (x > 10) return 10;
  return x;
}

/** Public for unit tests — matches Runway prompt limits. */
export function slicePromptUtf16(s: string, maxCodeUnits: number): string {
  return [...s].slice(0, maxCodeUnits).join("");
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

  const ratio = params.ratio ?? "720:1280";
  const duration = clampGen45Duration(params.duration ?? 5);

  try {
    const succeeded = await client.textToVideo
      .create({
        model: "gen4.5",
        promptText,
        ratio,
        duration,
      })
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
      return { ok: false, code: "runway_task_failed", message: msg };
    }
    if (e instanceof TaskTimedOutError) {
      return { ok: false, code: "runway_timeout" };
    }
    return { ok: false, code: "runway_api_error", message: String(e) };
  }
}
