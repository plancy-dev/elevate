/**
 * LLMs often wrap JSON in markdown fences or add a short preamble.
 * Extract a single JSON object/array substring for {@link JSON.parse}.
 */

const PREVIEW_MAX = 900;

function findBalancedJsonSlice(s: string): string | null {
  const t = s.trim().replace(/^\uFEFF/, "");
  let start = -1;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (c === "{" || c === "[") {
      start = i;
      break;
    }
  }
  if (start < 0) return null;

  const stack: string[] = [];
  let inString = false;
  let escape = false;
  const openers = new Set(["{", "["]);
  const closers: Record<string, string> = { "{": "}", "[": "]" };

  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (c === "\\" && inString) {
      escape = true;
      continue;
    }
    if (c === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (openers.has(c)) {
      stack.push(c);
    } else if (c === "}" || c === "]") {
      if (stack.length === 0) return null;
      const op = stack.pop()!;
      if (closers[op] !== c) return null;
      if (stack.length === 0) return t.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * Strips ```json ... ``` fences and returns the innermost JSON-looking substring.
 */
export function extractJsonPayloadFromLlmOutput(text: string): string | null {
  let t = text.trim().replace(/^\uFEFF/, "");
  if (!t) return null;

  const fence =
    /^```(?:json|JSON)?\s*\r?\n?([\s\S]*?)```/m.exec(t) ??
    /^```\s*\r?\n?([\s\S]*?)```/m.exec(t);
  if (fence?.[1]) {
    t = fence[1].trim();
  }

  if (t.startsWith("{") || t.startsWith("[")) {
    return t;
  }

  const sliced = findBalancedJsonSlice(t);
  return sliced?.trim() ?? null;
}

export function previewForSceneLlmLog(text: string): string {
  const oneLine = text.replace(/\s+/g, " ").trim();
  return oneLine.length <= PREVIEW_MAX ? oneLine : `${oneLine.slice(0, PREVIEW_MAX)}…`;
}
