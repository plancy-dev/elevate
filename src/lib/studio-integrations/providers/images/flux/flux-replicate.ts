/**
 * FLUX via Replicate adapter — server-only.
 *
 * Uses Replicate's sync prediction API with the FLUX 1.1 Pro model. The model
 * ID is pinned in IMAGE_PROVIDER_META (override via REPLICATE_FLUX_MODEL env
 * for operational flexibility).
 *
 * Docs: https://replicate.com/black-forest-labs/flux-1.1-pro/api
 */
import "server-only";

import {
  IMAGE_PROVIDER_META,
  type ImageGenParams,
  type ImageGenResult,
  type ImageProviderAdapter,
  type GeneratedImage,
} from "@/lib/studio-integrations/providers/images/types";

const DEFAULT_MODEL = IMAGE_PROVIDER_META.flux_replicate.defaultModel;
const MAX_COUNT = IMAGE_PROVIDER_META.flux_replicate.maxCount;
const DEFAULT_TIMEOUT_MS = 120_000;

function resolveModel(): string {
  return process.env.REPLICATE_FLUX_MODEL?.trim() || DEFAULT_MODEL;
}

function aspectToDimensions(aspect: ImageGenParams["aspectRatio"]): {
  width: number;
  height: number;
} {
  switch (aspect) {
    case "9:16":
      return { width: 768, height: 1344 };
    case "16:9":
      return { width: 1344, height: 768 };
    case "1:1":
    default:
      return { width: 1024, height: 1024 };
  }
}

type ReplicatePrediction = {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string | string[] | null;
  error?: string | null;
};

async function createPrediction(
  apiKey: string,
  model: string,
  input: Record<string, unknown>,
  signal: AbortSignal,
): Promise<ReplicatePrediction> {
  const [owner, name] = model.split("/");
  if (!owner || !name) {
    throw new Error(`invalid replicate model id: ${model}`);
  }
  const res = await fetch(
    `https://api.replicate.com/v1/models/${owner}/${name}/predictions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({ input }),
      signal,
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${text.slice(0, 300)}`);
  }
  return (await res.json()) as ReplicatePrediction;
}

async function downloadOutput(url: string): Promise<GeneratedImage | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type") ?? "image/webp";
    const bytes = Buffer.from(await res.arrayBuffer());
    return {
      bytes,
      mimeType,
      width: 0,
      height: 0,
      watermarkFree: true,
    };
  } catch {
    return null;
  }
}

export const fluxReplicateAdapter: ImageProviderAdapter = async (
  apiKey,
  params,
): Promise<ImageGenResult> => {
  const key = apiKey.trim();
  if (!key) {
    return { ok: false, code: "image_provider_missing_key" };
  }
  const prompt = params.prompt.trim();
  if (!prompt) {
    return { ok: false, code: "image_provider_empty_prompt" };
  }
  const count = Math.max(1, Math.min(params.count, MAX_COUNT));
  const { width, height } = aspectToDimensions(params.aspectRatio);
  const model = resolveModel();

  const baseInput: Record<string, unknown> = {
    prompt,
    aspect_ratio: params.aspectRatio,
    output_format: "png",
    // FLUX 1.1 Pro uses `width`/`height` via aspect_ratio; keep both for
    // compatibility with Ultra/Dev model variants users may pin via env.
    width,
    height,
    safety_tolerance: 2,
  };
  if (params.seed != null) baseInput.seed = params.seed;
  if (params.referenceImageUrl) baseInput.image_prompt = params.referenceImageUrl;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const images: GeneratedImage[] = [];

  try {
    // Replicate's public API does not accept `num_outputs` on flux-1.1-pro
    // reliably; fan out N calls to produce the candidate set (1-4 typical).
    const predictions = await Promise.all(
      Array.from({ length: count }, () =>
        createPrediction(key, model, baseInput, controller.signal),
      ),
    );

    for (const p of predictions) {
      if (p.status === "failed" || p.status === "canceled") {
        return {
          ok: false,
          code: "image_provider_api_error",
          message: p.error ?? p.status,
        };
      }
      const outputs = Array.isArray(p.output)
        ? p.output
        : p.output
          ? [p.output]
          : [];
      for (const url of outputs) {
        if (typeof url !== "string") continue;
        const img = await downloadOutput(url);
        if (img) images.push(img);
      }
    }

    if (images.length === 0) {
      return {
        ok: false,
        code: "image_provider_api_error",
        message: "no images produced",
      };
    }

    return { ok: true, model, images };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, code: "image_provider_timeout" };
    }
    return {
      ok: false,
      code: "image_provider_api_error",
      message: err instanceof Error ? err.message : String(err),
    };
  } finally {
    clearTimeout(timer);
  }
};
