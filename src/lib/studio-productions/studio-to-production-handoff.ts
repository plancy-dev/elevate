/**
 * Client-only: sessionStorage handoff from Prompt Studio → Productions.
 * @see docs/adr/ADR-003-studio-productions-mvp.md (integration follow-up)
 */

export const STUDIO_TO_PRODUCTIONS_STORAGE_KEY = "elevate:productions_prefill";

export type StudioToProductionHandoffV1 = {
  v: 1;
  source: "prompt_studio";
  createdAt: string;
  contentText: string;
  defaults: {
    artifact_role: string;
    tool_platform: string;
  };
  target: "new_episode" | "existing_episode";
  episodeId: string | null;
};

const DEFAULTS: StudioToProductionHandoffV1["defaults"] = {
  artifact_role: "prompt",
  tool_platform: "prompt_studio",
};

function isHandoffV1(x: unknown): x is StudioToProductionHandoffV1 {
  if (x == null || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  if (o.v !== 1) return false;
  if (o.source !== "prompt_studio") return false;
  if (typeof o.contentText !== "string") return false;
  if (o.target !== "new_episode" && o.target !== "existing_episode") return false;
  const d = o.defaults;
  if (d == null || typeof d !== "object") return false;
  const dd = d as Record<string, unknown>;
  if (typeof dd.artifact_role !== "string" || typeof dd.tool_platform !== "string")
    return false;
  if (o.episodeId != null && typeof o.episodeId !== "string") return false;
  return true;
}

/** Browser and unit tests (mocked); SSR/Node without mock returns null. */
function getSessionStorage(): Storage | null {
  try {
    const s = globalThis.sessionStorage;
    if (s && typeof s.getItem === "function") return s;
    return null;
  } catch {
    return null;
  }
}

export function writeStudioToProductionsHandoff(input: {
  contentText: string;
  target: "new_episode" | "existing_episode";
  episodeId?: string | null;
  defaults?: Partial<StudioToProductionHandoffV1["defaults"]>;
}): void {
  const store = getSessionStorage();
  if (!store) return;
  const payload: StudioToProductionHandoffV1 = {
    v: 1,
    source: "prompt_studio",
    createdAt: new Date().toISOString(),
    contentText: input.contentText,
    defaults: {
      artifact_role: input.defaults?.artifact_role ?? DEFAULTS.artifact_role,
      tool_platform: input.defaults?.tool_platform ?? DEFAULTS.tool_platform,
    },
    target: input.target,
    episodeId:
      input.target === "existing_episode" ? (input.episodeId ?? null) : null,
  };
  try {
    store.setItem(
      STUDIO_TO_PRODUCTIONS_STORAGE_KEY,
      JSON.stringify(payload),
    );
  } catch {
    // quota / private mode — silent fail; navigation still works without prefill
  }
}

function readRaw(): StudioToProductionHandoffV1 | null {
  const store = getSessionStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(STUDIO_TO_PRODUCTIONS_STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isHandoffV1(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Does not consume. Used so episode detail can open the Artifacts tab before
 * `consumeHandoffForEpisodeDetail` runs (same navigation as Prompt Studio handoff).
 */
export function hasPendingHandoffForEpisode(episodeId: string): boolean {
  const p = readRaw();
  return (
    !!p &&
    p.target === "existing_episode" &&
    p.episodeId === episodeId
  );
}

function clearRaw(): void {
  const store = getSessionStorage();
  if (!store) return;
  try {
    store.removeItem(STUDIO_TO_PRODUCTIONS_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** `/dashboard/productions/new` — prefill episode notes; clears handoff when consumed. */
export function consumeHandoffForNewEpisodePage(): string | null {
  const p = readRaw();
  if (!p || p.target !== "new_episode") return null;
  clearRaw();
  return p.contentText;
}

/** Episode detail — prefill add-artifact when `episodeId` matches; clears when consumed. */
export function consumeHandoffForEpisodeDetail(
  episodeId: string,
): {
  contentText: string;
  artifact_role: string;
  tool_platform: string;
} | null {
  const p = readRaw();
  if (
    !p ||
    p.target !== "existing_episode" ||
    !p.episodeId ||
    p.episodeId !== episodeId
  ) {
    return null;
  }
  clearRaw();
  return {
    contentText: p.contentText,
    artifact_role: p.defaults.artifact_role,
    tool_platform: p.defaults.tool_platform,
  };
}
