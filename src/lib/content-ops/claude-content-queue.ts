import { isAllowedDraftModel } from "@/lib/studio-productions/episode-llm-models";

const DEFAULT_CONTENT_OPS_ANTHROPIC_MODEL = "claude-sonnet-4-20250514";
const MAX_INPUT_CHARS = 110_000;

export const CONTENT_QUEUE_REVIEWER_SYSTEM = [
  "You are a senior editorial reviewer for an operator-focused AI newsletter/blog.",
  "The next user message contains metadata, automated quality gate reasons, and the draft markdown.",
  "Produce a single editorial brief in Markdown that another AI (editor) will use to revise the draft.",
  "The brief must include:",
  "1) ## Summary — why this draft is not ready (or what to double-check if gates passed).",
  "2) ## Per gate / issue — for each problem: concrete symptoms in the text + specific rewrite instructions.",
  "3) ## Must preserve — factual claims, links, and structure that must not be invented or removed without cause.",
  "4) ## Target shape — tone, length, headings, and citation behavior expected after the edit.",
  "Do not output the full rewritten article here. Be precise and actionable.",
].join(" ");

export const CONTENT_QUEUE_EDITOR_SYSTEM = [
  "You are an editorial rewriter. You will receive (1) an editorial brief in Markdown, then (2) the original draft.",
  "Apply the brief faithfully: fix overcopy, tighten structure, improve citations, comparisons, and counterarguments as instructed.",
  "Preserve factual accuracy; do not invent sources or quotes. Keep the same language as the original draft unless the brief says otherwise.",
  "Output ONLY the complete revised Markdown body for the article (no preamble, no code fences).",
].join(" ");

export function resolveContentOpsAnthropicConfig(): {
  apiKey: string;
  model: string;
} | null {
  const apiKey = (process.env.CONTENT_OPS_ANTHROPIC_API_KEY ?? "").trim();
  if (!apiKey) return null;
  const rawModel = (
    process.env.CONTENT_OPS_ANTHROPIC_MODEL ?? DEFAULT_CONTENT_OPS_ANTHROPIC_MODEL
  ).trim();
  const model = isAllowedDraftModel("anthropic", rawModel)
    ? rawModel
    : DEFAULT_CONTENT_OPS_ANTHROPIC_MODEL;
  return { apiKey, model };
}

export function truncateForClaudeInput(text: string, max = MAX_INPUT_CHARS): {
  text: string;
  truncated: boolean;
} {
  if (text.length <= max) return { text, truncated: false };
  return {
    text: `${text.slice(0, max)}\n\n[…truncated for API payload; shorten in editor and retry]`,
    truncated: true,
  };
}

export async function fetchAnthropicText(params: {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<{ ok: true; text: string } | { ok: false; status: number; body: string }> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens ?? 8192,
      system: params.system,
      messages: [{ role: "user", content: params.user }],
    }),
  });
  const rawBody = await res.text();
  if (!res.ok) {
    return { ok: false, status: res.status, body: rawBody.slice(0, 2000) };
  }
  try {
    const json = JSON.parse(rawBody) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = json.content?.find((c) => c.type === "text")?.text ?? "";
    return { ok: true, text };
  } catch {
    return { ok: false, status: 422, body: "invalid_json_response" };
  }
}

/** Remove a single surrounding ``` / ```markdown fence from model output. */
export function stripOuterMarkdownFence(raw: string): string {
  let s = raw.trim();
  if (!s.startsWith("```")) return s;
  const firstNl = s.indexOf("\n");
  if (firstNl === -1) return s;
  s = s.slice(firstNl + 1);
  const close = s.lastIndexOf("```");
  if (close !== -1) s = s.slice(0, close);
  return s.trim();
}

export function buildReviewerUserPayload(params: {
  itemType: string;
  locale: string;
  title: string;
  summary: string | null;
  bodyMarkdown: string;
  gateReasons: string[];
  gatePassed: boolean | null;
  qualityScore: number | null;
  reviewNotes: string | null;
}): { user: string; truncated: boolean } {
  const { text: body, truncated } = truncateForClaudeInput(params.bodyMarkdown);
  const lines = [
    `type: ${params.itemType}`,
    `locale: ${params.locale}`,
    `title: ${params.title}`,
    params.summary ? `summary: ${params.summary}` : "summary: (none)",
    `automated_gate_passed: ${params.gatePassed === null ? "unknown" : String(params.gatePassed)}`,
    `automated_gate_quality_score: ${params.qualityScore ?? "n/a"}`,
    `automated_gate_reasons: ${params.gateReasons.length ? params.gateReasons.join(", ") : "(none)"}`,
    params.reviewNotes
      ? `human_review_notes: ${params.reviewNotes}`
      : "human_review_notes: (none)",
    "",
    "--- DRAFT (markdown) ---",
    body,
  ];
  return { user: lines.join("\n"), truncated };
}

export function buildEditorUserPayload(params: {
  briefMarkdown: string;
  bodyMarkdown: string;
}): { user: string; truncated: boolean } {
  const { text: body, truncated } = truncateForClaudeInput(params.bodyMarkdown);
  const user = [
    "### Editorial brief (follow this)",
    params.briefMarkdown.trim(),
    "",
    "### Original draft",
    body,
  ].join("\n");
  return { user, truncated };
}
