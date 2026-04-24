/**
 * FLUX via fal.ai adapter — server-only.
 *
 * Uses fal.ai's `fal-ai/flux-pro` (and variants) with the sync-run endpoint
 * style. The exact path can be overridden with FAL_FLUX_MODEL_SLUG.
 *
 * Docs: https://fal.ai/models/fal-ai/flux-pro/api
 */
import "server-only";

import {
  IMAGE_PROVIDER_META,
  type ImageGenParams,
  type ImageGenResult,
  type ImageProviderAdapter,
  type GeneratedImage,
} from "@/lib/studio-integrations/providers/images/types";

const DEFAULT_MODEL = IMAGE_PROVIDER_META.flux_fal.defaultModel;
const MAX_COUNT = IMAGE_PROVIDER_META.flux_fal.maxCount;
const DEFAULT_TIMEOUT_MS = 120_000;

function resolveModelSlug(): string {
  return process.env.FAL_FLUX_MODEL_SLUG?.trim() || DEFAULT_MODEL;
}

function aspectToSize(aspect: ImageGenParams["aspectRatio"]): string {
  switch (aspect) {
    case "9:16":
      return "portrait_16_9";
    case "16:9":
      return "landscape_16_9";
    case "1:1":
    default:
      return "square_hd";
  }
}

type FalImage = {
  url: string;
  width?: number;
  height?: number;
  content_type?: string;
};

type FalResponse = {
  images?: FalImage[];
  seed?: number;
  has_nsfw_concepts?: boolean[];
};

async function downloadOutput(url: string): Promise<GeneratedImage | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const mimeType = res.headers.get("content-type") ?? "image/jpeg";
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

export const fluxFalAdapter: ImageProviderAdapter = async (
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
  const modelSlug = resolveModelSlug();

  const imageSize = aspectToSize(params.aspectRatio);

  const input: Record<string, unknown> = {
    prompt,
    image_size: imageSize,
    num_images: count,
    safety_tolerance: "2",
    output_format: "jpeg",
  };
  if (params.seed != null) input.seed = params.seed;
  if (params.referenceImageUrl) {
    // FLUX Pro variants expose `image_url` as the subject/reference slot when
    // using the flux-pro/v1.1-ultra or redux families. Safe to pass; unknown
    // fields are ignored by fal.
    input.image_url = params.referenceImageUrl;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`https://fal.run/${modelSlug}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 429) {
        return { ok: false, code: "image_provider_rate_limited", status: 429 };
      }
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        code: "image_provider_api_error",
        status: res.status,
        message: text.slice(0, 500),
      };
    }

    const body = (await res.json()) as FalResponse;
    const nsfwFlags = body.has_nsfw_concepts ?? [];
    if (nsfwFlags.every((flag) => flag === true) && nsfwFlags.length > 0) {
      return {
        ok: false,
        code: "image_provider_safety_blocked",
        message: "all outputs flagged",
      };
    }

    const images: GeneratedImage[] = [];
    for (const img of body.images ?? []) {
      const downloaded = await downloadOutput(img.url);
      if (downloaded) {
        if (img.width) downloaded.width = img.width;
        if (img.height) downloaded.height = img.height;
        if (body.seed != null) downloaded.seed = body.seed;
        images.push(downloaded);
      }
    }

    if (images.length === 0) {
      return {
        ok: false,
        code: "image_provider_api_error",
        message: "no images in response",
      };
    }

    return { ok: true, model: modelSlug, images };
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
