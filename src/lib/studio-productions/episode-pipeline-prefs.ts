import type { Json } from "@/types/database.types";

/** Total JSON size cap (bytes) for `studio_production_episodes.pipeline_prefs`. */
export const PIPELINE_PREFS_JSON_MAX_BYTES = 600_000;

/**
 * Deep-merge JSON object patches. Non-plain values from `patch` replace.
 * Nested plain objects are merged recursively. Arrays are replaced wholesale.
 */
export function mergePipelinePrefsPatch(base: Json, patch: Json): Json {
  if (patch === null || typeof patch !== "object" || Array.isArray(patch)) {
    return patch;
  }
  if (base === null || typeof base !== "object" || Array.isArray(base)) {
    return patch;
  }
  const a = base as Record<string, Json>;
  const b = patch as Record<string, Json>;
  const out: Record<string, Json> = { ...a };
  for (const [k, bv] of Object.entries(b)) {
    const av = a[k];
    if (
      bv !== null &&
      typeof bv === "object" &&
      !Array.isArray(bv) &&
      av !== null &&
      typeof av === "object" &&
      !Array.isArray(av)
    ) {
      out[k] = mergePipelinePrefsPatch(av, bv);
    } else {
      out[k] = bv;
    }
  }
  return out;
}

export function pipelinePrefsJsonByteLength(j: Json): number {
  try {
    return new TextEncoder().encode(JSON.stringify(j)).length;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

export function validatePipelinePrefsJsonSize(
  j: Json,
): { ok: true } | { ok: false; error: "studioPipelinePrefsTooLarge" } {
  if (pipelinePrefsJsonByteLength(j) > PIPELINE_PREFS_JSON_MAX_BYTES) {
    return { ok: false, error: "studioPipelinePrefsTooLarge" };
  }
  return { ok: true };
}

export type SceneRenderPipelinePrefs = {
  scenesJson: string;
  planModelId: string;
  targetSceneCount: string;
  /** Runway text-to-video model (gen4.5, veo3.1, …). */
  runwayModelId: string;
  /** Appended to every scene visual prompt (after brand guide merge). */
  visualPromptSuffix: string;
};

export function sceneRenderPrefsFromPipelinePrefs(
  root: Json | null | undefined,
): SceneRenderPipelinePrefs {
  const empty: SceneRenderPipelinePrefs = {
    scenesJson: "",
    planModelId: "",
    targetSceneCount: "",
    runwayModelId: "",
    visualPromptSuffix: "",
  };
  if (root === null || root === undefined || typeof root !== "object" || Array.isArray(root)) {
    return empty;
  }
  const sr = (root as Record<string, Json>).sceneRender;
  if (sr === null || typeof sr !== "object" || Array.isArray(sr)) return empty;
  const o = sr as Record<string, unknown>;
  return {
    scenesJson: typeof o.scenesJson === "string" ? o.scenesJson : "",
    planModelId: typeof o.planModelId === "string" ? o.planModelId : "",
    targetSceneCount: typeof o.targetSceneCount === "string" ? o.targetSceneCount : "",
    runwayModelId: typeof o.runwayModelId === "string" ? o.runwayModelId : "",
    visualPromptSuffix: typeof o.visualPromptSuffix === "string" ? o.visualPromptSuffix : "",
  };
}

export type PreprodStepPrefs = {
  modelId: string;
  customInstructions: string;
};

export function preprodStepPrefsFromPipelinePrefs(
  root: Json | null | undefined,
  stepKey: string,
): PreprodStepPrefs {
  const empty: PreprodStepPrefs = { modelId: "", customInstructions: "" };
  if (!stepKey) return empty;
  if (root === null || root === undefined || typeof root !== "object" || Array.isArray(root)) {
    return empty;
  }
  const map = (root as Record<string, Json>).preprodSteps;
  if (map === null || typeof map !== "object" || Array.isArray(map)) return empty;
  const step = (map as Record<string, Json>)[stepKey];
  if (step === null || typeof step !== "object" || Array.isArray(step)) return empty;
  const o = step as Record<string, unknown>;
  return {
    modelId: typeof o.modelId === "string" ? o.modelId : "",
    customInstructions:
      typeof o.customInstructions === "string" ? o.customInstructions : "",
  };
}

export type TtsPipelinePrefs = {
  voicePreset: "female" | "male" | "custom";
  voiceId: string;
  language: string;
  stability: string;
  similarity: string;
  style: string;
  speakerBoost: string;
};

export function ttsPrefsFromPipelinePrefs(
  root: Json | null | undefined,
  defaultLanguage: string,
): TtsPipelinePrefs {
  const base: TtsPipelinePrefs = {
    voicePreset: "female",
    voiceId: "",
    language: defaultLanguage,
    stability: "0.5",
    similarity: "0.75",
    style: "",
    speakerBoost: "",
  };
  if (root === null || root === undefined || typeof root !== "object" || Array.isArray(root)) {
    return base;
  }
  const tt = (root as Record<string, Json>).tts;
  if (tt === null || typeof tt !== "object" || Array.isArray(tt)) return base;
  const o = tt as Record<string, unknown>;
  const vp = o.voicePreset;
  const voicePreset =
    vp === "male" || vp === "custom" || vp === "female" ? vp : base.voicePreset;
  return {
    voicePreset,
    voiceId: typeof o.voiceId === "string" ? o.voiceId : "",
    language: typeof o.language === "string" && o.language.trim() ? o.language : defaultLanguage,
    stability: typeof o.stability === "string" ? o.stability : base.stability,
    similarity: typeof o.similarity === "string" ? o.similarity : base.similarity,
    style: typeof o.style === "string" ? o.style : "",
    speakerBoost: typeof o.speakerBoost === "string" ? o.speakerBoost : "",
  };
}

export type AssemblyPipelinePrefs = {
  bgMusicUrl: string;
  bgMusicVolume: string;
};

export function assemblyPrefsFromPipelinePrefs(
  root: Json | null | undefined,
): AssemblyPipelinePrefs {
  const empty: AssemblyPipelinePrefs = { bgMusicUrl: "", bgMusicVolume: "0.15" };
  if (root === null || root === undefined || typeof root !== "object" || Array.isArray(root)) {
    return empty;
  }
  const a = (root as Record<string, Json>).assembly;
  if (a === null || typeof a !== "object" || Array.isArray(a)) return empty;
  const o = a as Record<string, unknown>;
  return {
    bgMusicUrl: typeof o.bgMusicUrl === "string" ? o.bgMusicUrl : "",
    bgMusicVolume: typeof o.bgMusicVolume === "string" ? o.bgMusicVolume : "0.15",
  };
}

/** Episode-scoped draft workbench UI (`pipeline_prefs.draftWorkbench`). */
export type DraftWorkbenchPipelinePrefs = {
  stickyContext: string;
};

export function draftWorkbenchPrefsFromPipelinePrefs(
  root: Json | null | undefined,
): DraftWorkbenchPipelinePrefs {
  const empty: DraftWorkbenchPipelinePrefs = { stickyContext: "" };
  if (root === null || root === undefined || typeof root !== "object" || Array.isArray(root)) {
    return empty;
  }
  const dw = (root as Record<string, Json>).draftWorkbench;
  if (dw === null || typeof dw !== "object" || Array.isArray(dw)) return empty;
  const o = dw as Record<string, unknown>;
  return {
    stickyContext: typeof o.stickyContext === "string" ? o.stickyContext : "",
  };
}
