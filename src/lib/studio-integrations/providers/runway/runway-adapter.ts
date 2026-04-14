import { verifyRunwayApiKey } from "@/lib/studio-integrations/runway-verify";
import type {
  ProviderRunStepResult,
  StudioProviderAdapter,
} from "@/lib/studio-integrations/providers/types";
import { runRunwayTextToVideo } from "@/lib/studio-integrations/providers/runway/runway-text-to-video";

/**
 * Runway ML API — health via organization ping; text-to-video via `runStep` + SDK.
 * @see https://docs.dev.runwayml.com/
 */
export const runwayAdapter: StudioProviderAdapter = {
  id: "runway",

  async healthCheck(secret: string) {
    const r = await verifyRunwayApiKey(secret);
    if (r.ok) return { ok: true };
    return { ok: false, status: r.status };
  },

  async runStep(secret: string, args: Record<string, unknown>): Promise<ProviderRunStepResult> {
    const promptText = typeof args.prompt_text === "string" ? args.prompt_text : "";
    if (!promptText.trim()) {
      return { ok: false, code: "runway_missing_prompt" };
    }

    const ratioRaw = args.ratio;
    const ratio =
      ratioRaw === "1280:720" || ratioRaw === "720:1280" ? ratioRaw : undefined;

    let duration: number | undefined;
    if (typeof args.duration === "number" && Number.isFinite(args.duration)) {
      duration = args.duration;
    }

    const r = await runRunwayTextToVideo(secret, { promptText, ratio, duration });
    if (!r.ok) {
      if (r.code === "runway_empty_prompt") {
        return { ok: false, code: "runway_empty_prompt" };
      }
      if (r.code === "runway_task_failed") {
        return { ok: false, code: "runway_task_failed", message: r.message };
      }
      if (r.code === "runway_timeout") {
        return { ok: false, code: "runway_timeout" };
      }
      return { ok: false, code: "runway_api_error", message: r.message };
    }
    return { ok: true, task_id: r.task_id, output_urls: r.output_urls };
  },
};
