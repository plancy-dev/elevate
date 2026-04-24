/**
 * Gemini 2.5 Flash Image ("Nano Banana 2") adapter — server-only.
 *
 * Generates one or more candidate images via the Google Generative Language
 * REST API. Optionally conditions on a Master Reference Image (subject
 * reference) passed as inline data in the prompt parts.
 *
 * Docs: https://ai.google.dev/gemini-api/docs/image-generation
 */
import "server-only";

import {
  IMAGE_PROVIDER_META,
  type ImageGenErrorCode,
  type ImageGenParams,
  type ImageGenResult,
  type ImageProviderAdapter,
  type GeneratedImage,
} from "@/lib/studio-integrations/providers/images/types";

const GEMINI_MODEL = IMAGE_PROVIDER_META.google_gemini.defaultModel;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
const MAX_COUNT = IMAGE_PROVIDER_META.google_gemini.maxCount;
const DEFAULT_TIMEOUT_MS = 60_000;

type InlineDataPart = { inline_data: { mime_type: string; data: string } };
type TextPart = { text: string };
type Part = InlineDataPart | TextPart;

type GeminiResponseBody = {
  candidates?: Array<{
    content?: { parts?: Array<{ inlineData?: { mimeType?: string; data?: string } }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
};

async function fetchReferenceImageAsInline(
  url: string,
): Promise<InlineDataPart | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const buf = Buffer.from(await res.arrayBuffer());
    return {
      inline_data: { mime_type: contentType, data: buf.toString("base64") },
    };
  } catch {
    return null;
  }
}

function buildPromptWithAspect(
  prompt: string,
  aspectRatio: ImageGenParams["aspectRatio"],
): string {
  // Gemini 2.5 Flash Image does not expose a structured aspect ratio parameter
  // yet; we include it verbatim in the prompt for stronger adherence.
  const aspectLine = `Aspect ratio: ${aspectRatio}.`;
  return `${aspectLine}\n\n${prompt}`;
}

export const geminiImageAdapter: ImageProviderAdapter = async (
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

  const parts: Part[] = [];

  if (params.referenceImageUrl) {
    const ref = await fetchReferenceImageAsInline(params.referenceImageUrl);
    if (ref) {
      parts.push(ref);
      parts.push({
        text: "Use the image above as the primary subject / identity reference. Keep the same person, wardrobe, and visual style.",
      });
    }
  }

  parts.push({ text: buildPromptWithAspect(prompt, params.aspectRatio) });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  const images: GeneratedImage[] = [];

  try {
    // Gemini's image-generation models (Nano Banana / Nano Banana 2 / Pro) do
    // not support `candidateCount > 1`. Fan out `count` parallel requests
    // instead, same as the FLUX Replicate adapter.
    const url = new URL(GEMINI_ENDPOINT);
    url.searchParams.set("key", key);

    type SingleCallResult =
      | { ok: true; images: GeneratedImage[] }
      | { ok: false; code: ImageGenErrorCode; status?: number; message?: string };
    const singleCall = async (): Promise<SingleCallResult> => {
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts }],
          generationConfig: {
            candidateCount: 1,
            responseModalities: ["IMAGE"],
          },
        }),
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

      const body = (await res.json()) as GeminiResponseBody;

      if (body.promptFeedback?.blockReason) {
        return {
          ok: false,
          code: "image_provider_safety_blocked",
          message: body.promptFeedback.blockReason,
        };
      }

      const imgs: GeneratedImage[] = [];
      for (const cand of body.candidates ?? []) {
        for (const p of cand.content?.parts ?? []) {
          if (p.inlineData?.data && p.inlineData.mimeType) {
            imgs.push({
              bytes: Buffer.from(p.inlineData.data, "base64"),
              mimeType: p.inlineData.mimeType,
              width: 0,
              height: 0,
              watermarkFree: true,
            });
          }
        }
      }
      return { ok: true, images: imgs };
    };

    const results = await Promise.all(
      Array.from({ length: count }, () => singleCall()),
    );

    // If every parallel call was safety-blocked, surface that code; if every
    // call failed for another reason, surface the first error. Otherwise
    // aggregate the images we did get.
    const allSafetyBlocked = results.every(
      (r) => !r.ok && r.code === "image_provider_safety_blocked",
    );
    if (allSafetyBlocked) {
      const first = results[0];
      return {
        ok: false,
        code: "image_provider_safety_blocked",
        message: !first.ok ? first.message : undefined,
      };
    }

    for (const r of results) {
      if (r.ok) images.push(...r.images);
    }

    if (images.length === 0) {
      const firstError = results.find(
        (r): r is Extract<SingleCallResult, { ok: false }> => !r.ok,
      );
      if (firstError) {
        return {
          ok: false,
          code: firstError.code,
          status: firstError.status,
          message: firstError.message,
        };
      }
      return {
        ok: false,
        code: "image_provider_api_error",
        message: "no images in response",
      };
    }

    return { ok: true, model: GEMINI_MODEL, images };
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
