/**
 * LLM-based scene breakdown for Runway (OpenAI preferred, then Anthropic).
 */
import "server-only";

import type { OrgLlmCredential } from "@/lib/studio-productions/episode-llm";
import { resolveDraftModel } from "@/lib/studio-productions/episode-llm-models";
import {
  extractJsonPayloadFromLlmOutput,
  previewForSceneLlmLog,
} from "@/lib/studio-productions/llm-scene-json-extract";
import { parseScenesJsonStrict } from "@/lib/studio-productions/resolve-episode-scenes";

const SYSTEM = [
  "You split a short-form video script into scenes for AI video generation (Runway).",
  "Output valid JSON only, no markdown.",
  'Preferred shape: {"scenes":[{"narration":"string","visual_prompt":"string","duration":5}]} — or a top-level JSON array of those objects.',
  "Use keys narration and visual_prompt (snake_case). duration may be duration, duration_seconds, or durationSeconds; integer 2-10 seconds per clip.",
  "Use 4–8 scenes for a typical Shorts script unless the script is very short.",
  "narration must be the exact voiceover line for that scene in the script language (full sentences). Never use bullet lists, numbered outlines, or stage directions only.",
  "visual_prompt must be visually concrete (setting, motion, lighting); no meta-instructions about JSON.",
].join(" ");

export async function generateScenesWithLlm(params: {
  cred: OrgLlmCredential;
  scriptText: string;
  brandGuide?: string | null;
  model?: string | null;
}): Promise<{ ok: true; json: string } | { ok: false; code: "llm_failed" | "parse_failed" }> {
  const { cred, scriptText, brandGuide, model } = params;
  const trimmed = scriptText.trim();
  if (!trimmed) return { ok: false, code: "parse_failed" };

  const brand = (brandGuide ?? "").trim();
  const user = [
    "Script:",
    trimmed.slice(0, 24_000),
    brand ? `\n\nBrand / style guide (honor in narration tone and visual_prompt):\n${brand.slice(0, 8000)}` : "",
  ].join("");

  const resolvedModel = resolveDraftModel(cred.provider, model);

  let rawText = "";

  if (cred.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cred.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        temperature: 0.4,
        max_tokens: 4096,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: user },
        ],
      }),
    });
    if (!res.ok) return { ok: false, code: "llm_failed" };
    const body = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    rawText = body.choices?.[0]?.message?.content ?? "";
  } else {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": cred.apiKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: resolvedModel,
        max_tokens: 4096,
        system: SYSTEM,
        messages: [{ role: "user", content: user }],
      }),
    });
    if (!res.ok) return { ok: false, code: "llm_failed" };
    const body = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    rawText = body.content?.find((c) => c.type === "text")?.text ?? "";
  }

  const extracted = extractJsonPayloadFromLlmOutput(rawText);
  const payload = (extracted?.length ? extracted : rawText.trim()) || "";
  if (!payload) {
    console.warn("[generateScenesWithLlm] empty model output");
    return { ok: false, code: "parse_failed" };
  }

  let parsed = parseScenesJsonStrict(payload);
  if (!parsed.ok && payload !== rawText.trim()) {
    parsed = parseScenesJsonStrict(rawText.trim());
  }
  if (!parsed.ok) {
    console.warn(
      "[generateScenesWithLlm] JSON parse/validate failed:",
      parsed.error,
      "payload preview:",
      previewForSceneLlmLog(payload),
    );
    return { ok: false, code: "parse_failed" };
  }

  return { ok: true, json: JSON.stringify(parsed.scenes, null, 2) };
}
