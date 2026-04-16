/**
 * Allowlisted models for episode draft generation (OpenAI Chat Completions / Anthropic Messages).
 * Server validates; UI uses the same lists for selects.
 *
 * `pricingHint` values are approximate provider list prices (USD per 1M input · output tokens)
 * for comparison; billing, caching, and promotions can change actual cost.
 */

export type DraftModelCostTier = "low" | "medium" | "high";

export type DraftModelOption = {
  readonly id: string;
  readonly costTier: DraftModelCostTier;
  /** Short USD hint for same-provider comparison (indicative). */
  readonly pricingHint: string;
};

export const OPENAI_DRAFT_MODEL_OPTIONS = [
  {
    id: "gpt-5.4-nano",
    costTier: "low",
    pricingHint: "$0.20/M in · $1.25/M out",
  },
  {
    id: "gpt-5.4-mini",
    costTier: "medium",
    pricingHint: "$0.75/M in · $4.50/M out",
  },
  {
    id: "gpt-5.4",
    costTier: "high",
    pricingHint: "$2.50/M in · $15/M out",
  },
  {
    id: "gpt-4o-mini",
    costTier: "low",
    pricingHint: "~$0.15/M in · ~$0.60/M out (4o era)",
  },
  {
    id: "gpt-4o",
    costTier: "medium",
    pricingHint: "~$2.50/M in · ~$10/M out (4o era)",
  },
  {
    id: "gpt-4-turbo",
    costTier: "medium",
    pricingHint: "legacy · see OpenAI pricing",
  },
  {
    id: "gpt-3.5-turbo",
    costTier: "low",
    pricingHint: "legacy · see OpenAI pricing",
  },
] as const satisfies readonly DraftModelOption[];

/** Default LLM for packaging draft (title, description, thumbnail prompt) in the production pipeline. */
export const DEFAULT_PACKAGING_DRAFT_MODEL_ID = "claude-opus-4-6";

export const ANTHROPIC_DRAFT_MODEL_OPTIONS = [
  {
    id: "claude-haiku-4-5-20251001",
    costTier: "low",
    pricingHint: "$1/M in · $5/M out",
  },
  {
    id: "claude-sonnet-4-6",
    costTier: "medium",
    pricingHint: "$3/M in · $15/M out",
  },
  {
    id: "claude-opus-4-6",
    costTier: "high",
    pricingHint: "$5/M in · $25/M out",
  },
  {
    id: "claude-sonnet-4-5-20250929",
    costTier: "medium",
    pricingHint: "$3/M in · $15/M out",
  },
  {
    id: "claude-opus-4-5-20251101",
    costTier: "high",
    pricingHint: "$5/M in · $25/M out",
  },
  {
    id: "claude-opus-4-1-20250805",
    costTier: "high",
    pricingHint: "$15/M in · $75/M out",
  },
  {
    id: "claude-sonnet-4-20250514",
    costTier: "medium",
    pricingHint: "$3/M in · $15/M out",
  },
  {
    id: "claude-opus-4-20250514",
    costTier: "high",
    pricingHint: "$5/M in · $25/M out",
  },
  {
    id: "claude-3-5-haiku-20241022",
    costTier: "low",
    pricingHint: "Claude 3.5 · legacy · see Anthropic pricing",
  },
  {
    id: "claude-3-5-sonnet-20241022",
    costTier: "medium",
    pricingHint: "Claude 3.5 · legacy · see Anthropic pricing",
  },
  {
    id: "claude-3-opus-20240229",
    costTier: "high",
    pricingHint: "Claude 3 · legacy · see Anthropic pricing",
  },
] as const satisfies readonly DraftModelOption[];

/** Model ids only; same order as `OPENAI_DRAFT_MODEL_OPTIONS`. */
export const OPENAI_DRAFT_MODELS = OPENAI_DRAFT_MODEL_OPTIONS.map((o) => o.id);

/** Model ids only; same order as `ANTHROPIC_DRAFT_MODEL_OPTIONS`. */
export const ANTHROPIC_DRAFT_MODELS = ANTHROPIC_DRAFT_MODEL_OPTIONS.map((o) => o.id);

export type StudioDraftLlmProvider = "openai" | "anthropic";

export function defaultDraftModel(provider: StudioDraftLlmProvider): string {
  return provider === "openai"
    ? OPENAI_DRAFT_MODEL_OPTIONS[0].id
    : ANTHROPIC_DRAFT_MODEL_OPTIONS[0].id;
}

export function isAllowedDraftModel(
  provider: StudioDraftLlmProvider,
  model: string,
): boolean {
  const list =
    provider === "openai"
      ? OPENAI_DRAFT_MODEL_OPTIONS
      : ANTHROPIC_DRAFT_MODEL_OPTIONS;
  return list.some((o) => o.id === model);
}

/** Picks allowlisted model or falls back to default for the provider. */
export function resolveDraftModel(
  provider: StudioDraftLlmProvider,
  modelRaw: string | null | undefined,
): string {
  const m = (modelRaw ?? "").trim();
  if (m && isAllowedDraftModel(provider, m)) return m;
  return defaultDraftModel(provider);
}

export function parseDraftLlmProvider(
  raw: string | null | undefined,
): StudioDraftLlmProvider | null {
  const s = (raw ?? "").trim();
  if (s === "openai" || s === "anthropic") return s;
  return null;
}

/**
 * Resolves provider from form + org availability. Returns null if no key is configured
 * or the requested provider is not available.
 */
export function chooseStudioDraftLlmProvider(
  availability: { openai: boolean; anthropic: boolean },
  providerRaw: string | null | undefined,
): StudioDraftLlmProvider | null {
  const parsed = parseDraftLlmProvider(providerRaw);
  if (parsed === "openai") {
    return availability.openai ? "openai" : null;
  }
  if (parsed === "anthropic") {
    return availability.anthropic ? "anthropic" : null;
  }
  if (availability.openai && !availability.anthropic) return "openai";
  if (!availability.openai && availability.anthropic) return "anthropic";
  if (availability.openai && availability.anthropic) return "openai";
  return null;
}
