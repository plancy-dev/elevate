/**
 * Seedream (BytePlus ModelArk) image generation adapter — server-only.
 *
 * BytePlus exposes a REST endpoint where the caller specifies the model name
 * and a prompt. A Master Reference Image URL is accepted via the `image`
 * parameter for subject consistency.
 *
 * Docs: https://docs.byteplus.com/en/docs/ModelArk/1099455
 */
import "server-only";

import {
  IMAGE_PROVIDER_META,
  type ImageGenParams,
  type ImageGenResult,
  type ImageProviderAdapter,
  type GeneratedImage,
} from "@/lib/studio-integrations/providers/images/types";

const DEFAULT_MODEL = IMAGE_PROVIDER_META.seedream.defaultModel;
const MAX_COUNT = IMAGE_PROVIDER_META.seedream.maxCount;
const DEFAULT_TIMEOUT_MS = 120_000;

const SEEDREAM_ENDPOINT =
  process.env.BYTEPLUS_SEEDREAM_ENDPOINT?.trim() ||
  "https://ark.ap-southeast.bytepluses.com/api/v3/images/generations";

function resolveModel(): string {
  return process.env.BYTEPLUS_SEEDREAM_MODEL?.trim() || DEFAULT_MODEL;
}

function aspectToSize(aspect: ImageGenParams["aspectRatio"]): string {
  switch (aspect) {
    case "9:16":
      return "768x1344";
    case "16:9":
      return "1344x768";
    case "1:1":
    default:
      return "1024x1024";
  }
}

type SeedreamBody = {
  data?: Array<{
    b64_json?: string;
    url?: string;
    width?: number;
    height?: number;
  }>;
  error?: { message?: string; code?: string };
};

async function resolveImage(
  data: { b64_json?: string; url?: string; width?: number; height?: number },
): Promise<GeneratedImage | null> {
  try {
    if (data.b64_json) {
      return {
        bytes: Buffer.from(data.b64_json, "base64"),
        mimeType: "image/png",
        width: data.width ?? 0,
        height: data.height ?? 0,
        watermarkFree: true,
      };
    }
    if (data.url) {
      const res = await fetch(data.url, { cache: "no-store" });
      if (!res.ok) return null;
      return {
        bytes: Buffer.from(await res.arrayBuffer()),
        mimeType: res.headers.get("content-type") ?? "image/png",
        width: data.width ?? 0,
        height: data.height ?? 0,
        watermarkFree: true,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export const seedreamAdapter: ImageProviderAdapter = async (
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
  const model = resolveModel();
  const size = aspectToSize(params.aspectRatio);

  const body: Record<string, unknown> = {
    model,
    prompt,
    size,
    n: count,
    response_format: "b64_json",
    watermark: false,
  };
  if (params.seed != null) body.seed = params.seed;
  if (params.referenceImageUrl) body.image = params.referenceImageUrl;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(SEEDREAM_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
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

    const parsed = (await res.json()) as SeedreamBody;
    if (parsed.error) {
      return {
        ok: false,
        code: "image_provider_api_error",
        message: parsed.error.message ?? parsed.error.code,
      };
    }

    const images: GeneratedImage[] = [];
    for (const data of parsed.data ?? []) {
      const resolved = await resolveImage(data);
      if (resolved) images.push(resolved);
    }

    if (images.length === 0) {
      return {
        ok: false,
        code: "image_provider_api_error",
        message: "no images in response",
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
