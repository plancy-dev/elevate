import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  STUDIO_TO_PRODUCTIONS_STORAGE_KEY,
  consumeHandoffForEpisodeDetail,
  consumeHandoffForNewEpisodePage,
  hasPendingHandoffForEpisode,
  writeStudioToProductionsHandoff,
} from "@/lib/studio-productions/studio-to-production-handoff";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    get length() {
      return m.size;
    },
    clear() {
      m.clear();
    },
    getItem(k: string) {
      return m.get(k) ?? null;
    },
    key(i: number) {
      return [...m.keys()][i] ?? null;
    },
    removeItem(k: string) {
      m.delete(k);
    },
    setItem(k: string, v: string) {
      m.set(k, v);
    },
  } as Storage;
}

describe("studio-to-production-handoff", () => {
  beforeEach(() => {
    vi.stubGlobal("sessionStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("writes and consumes new-episode handoff", () => {
    writeStudioToProductionsHandoff({
      contentText: "hello notes",
      target: "new_episode",
    });
    const raw = globalThis.sessionStorage.getItem(
      STUDIO_TO_PRODUCTIONS_STORAGE_KEY,
    );
    expect(raw).toBeTruthy();
    expect(raw).toContain("new_episode");

    const notes = consumeHandoffForNewEpisodePage();
    expect(notes).toBe("hello notes");
    expect(
      globalThis.sessionStorage.getItem(STUDIO_TO_PRODUCTIONS_STORAGE_KEY),
    ).toBeNull();
  });

  it("consumes existing-episode handoff when id matches", () => {
    writeStudioToProductionsHandoff({
      contentText: "artifact body",
      target: "existing_episode",
      episodeId: "ep-1",
    });
    const prefill = consumeHandoffForEpisodeDetail("ep-1");
    expect(prefill).toEqual({
      contentText: "artifact body",
      artifact_role: "prompt",
      tool_platform: "prompt_studio",
    });
    expect(
      globalThis.sessionStorage.getItem(STUDIO_TO_PRODUCTIONS_STORAGE_KEY),
    ).toBeNull();
  });

  it("returns null for episode detail when id mismatches and leaves storage", () => {
    writeStudioToProductionsHandoff({
      contentText: "x",
      target: "existing_episode",
      episodeId: "ep-1",
    });
    expect(consumeHandoffForEpisodeDetail("ep-2")).toBeNull();
    const raw = globalThis.sessionStorage.getItem(
      STUDIO_TO_PRODUCTIONS_STORAGE_KEY,
    );
    expect(raw).toBeTruthy();
    expect(raw).toContain("ep-1");
  });

  it("hasPendingHandoffForEpisode is true without consuming", () => {
    writeStudioToProductionsHandoff({
      contentText: "x",
      target: "existing_episode",
      episodeId: "ep-9",
    });
    expect(hasPendingHandoffForEpisode("ep-9")).toBe(true);
    expect(hasPendingHandoffForEpisode("ep-8")).toBe(false);
    expect(consumeHandoffForEpisodeDetail("ep-9")).not.toBeNull();
    expect(hasPendingHandoffForEpisode("ep-9")).toBe(false);
  });
});
