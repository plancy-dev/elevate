"use client";

/**
 * Editor store — a single `useReducer` powers the entire timeline editor
 * so we don't add a runtime dependency. All state is plain JSON-serializable
 * so the debounced autosave can stringify it directly.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type Dispatch,
  type ReactNode,
} from "react";
import {
  DEFAULT_OVERLAY_STYLE,
  EDITOR_DSL_MAX_OVERLAYS,
  type EditorAudio,
  type EditorDslV3,
  type EditorOverlay,
  type EditorScene,
  type OverlayAnimation,
  type OverlayPosition,
  type OverlayTextStyle,
} from "@/lib/studio-productions/editor-dsl";

export type EditorSaveStatus =
  | { state: "idle" }
  | { state: "dirty" }
  | { state: "saving" }
  | { state: "saved"; savedAt: string }
  | { state: "error"; code: string };

export type EditorState = {
  dsl: EditorDslV3;
  saveStatus: EditorSaveStatus;
  playback: {
    isPlaying: boolean;
    currentTimeSec: number;
  };
  selection:
    | { kind: "none" }
    | { kind: "scene"; sceneId: string }
    | { kind: "overlay"; overlayId: string }
    | { kind: "audio"; target: "narration" | "bgm" };
};

export type EditorAction =
  | { type: "replaceDsl"; dsl: EditorDslV3 }
  | { type: "reorderScene"; fromIndex: number; toIndex: number }
  | { type: "updateScene"; sceneId: string; patch: Partial<EditorScene> }
  | { type: "addOverlay"; atSec: number; totalSec: number }
  | { type: "updateOverlay"; overlayId: string; patch: Partial<EditorOverlay> }
  | { type: "removeOverlay"; overlayId: string }
  | { type: "setAudio"; patch: Partial<EditorAudio> }
  | { type: "setNarrationGain"; gainDb: number }
  | {
      type: "setBgm";
      bgm: EditorAudio["bgm"];
    }
  | { type: "select"; selection: EditorState["selection"] }
  | { type: "setPlayback"; playback: Partial<EditorState["playback"]> }
  | { type: "markDirty" }
  | { type: "markSaving" }
  | { type: "markSaved"; savedAt: string }
  | { type: "markError"; code: string };

function randomId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function recomputeTotalDuration(scenes: EditorScene[]): number {
  let total = 0;
  for (let i = 0; i < scenes.length; i += 1) {
    const transition = (scenes[i].transitionToNextMs ?? 0) / 1000;
    total += scenes[i].targetDurationSec - (i < scenes.length - 1 ? transition : 0);
  }
  return Math.max(total, 1);
}

function touch(dsl: EditorDslV3): EditorDslV3 {
  return { ...dsl, updatedAt: new Date().toISOString() };
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "replaceDsl":
      return {
        ...state,
        dsl: action.dsl,
        saveStatus: { state: "saved", savedAt: action.dsl.updatedAt },
      };

    case "reorderScene": {
      const { fromIndex, toIndex } = action;
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.dsl.scenes.length ||
        toIndex >= state.dsl.scenes.length
      ) {
        return state;
      }
      const scenes = [...state.dsl.scenes];
      const [moved] = scenes.splice(fromIndex, 1);
      scenes.splice(toIndex, 0, moved);
      const next = touch({
        ...state.dsl,
        scenes,
        totalDurationSec: recomputeTotalDuration(scenes),
      });
      return { ...state, dsl: next, saveStatus: { state: "dirty" } };
    }

    case "updateScene": {
      const scenes = state.dsl.scenes.map((s) =>
        s.id === action.sceneId ? { ...s, ...action.patch } : s,
      );
      const next = touch({
        ...state.dsl,
        scenes,
        totalDurationSec: recomputeTotalDuration(scenes),
      });
      return { ...state, dsl: next, saveStatus: { state: "dirty" } };
    }

    case "addOverlay": {
      if (state.dsl.overlays.length >= EDITOR_DSL_MAX_OVERLAYS) return state;
      const overlay: EditorOverlay = {
        id: randomId("overlay"),
        kind: "text",
        text: "New text",
        startSec: Math.max(0, Math.min(action.atSec, action.totalSec - 1)),
        endSec: Math.max(
          action.atSec + 2,
          Math.min(action.totalSec, action.atSec + 2),
        ),
        position: "bottom",
        style: { ...DEFAULT_OVERLAY_STYLE },
        animation: "fade_in",
        animationDurationSec: 0.3,
      };
      const next = touch({
        ...state.dsl,
        overlays: [...state.dsl.overlays, overlay],
      });
      return {
        ...state,
        dsl: next,
        saveStatus: { state: "dirty" },
        selection: { kind: "overlay", overlayId: overlay.id },
      };
    }

    case "updateOverlay": {
      const overlays = state.dsl.overlays.map((o) =>
        o.id === action.overlayId ? { ...o, ...action.patch } : o,
      );
      const next = touch({ ...state.dsl, overlays });
      return { ...state, dsl: next, saveStatus: { state: "dirty" } };
    }

    case "removeOverlay": {
      const overlays = state.dsl.overlays.filter(
        (o) => o.id !== action.overlayId,
      );
      const next = touch({ ...state.dsl, overlays });
      const selection =
        state.selection.kind === "overlay" &&
        state.selection.overlayId === action.overlayId
          ? { kind: "none" as const }
          : state.selection;
      return {
        ...state,
        dsl: next,
        saveStatus: { state: "dirty" },
        selection,
      };
    }

    case "setAudio": {
      const next = touch({
        ...state.dsl,
        audio: { ...state.dsl.audio, ...action.patch },
      });
      return { ...state, dsl: next, saveStatus: { state: "dirty" } };
    }

    case "setNarrationGain": {
      const narration = state.dsl.audio.narration;
      if (!narration) return state;
      const next = touch({
        ...state.dsl,
        audio: {
          ...state.dsl.audio,
          narration: { ...narration, gainDb: action.gainDb },
        },
      });
      return { ...state, dsl: next, saveStatus: { state: "dirty" } };
    }

    case "setBgm": {
      const next = touch({
        ...state.dsl,
        audio: { ...state.dsl.audio, bgm: action.bgm },
      });
      return { ...state, dsl: next, saveStatus: { state: "dirty" } };
    }

    case "select":
      return { ...state, selection: action.selection };

    case "setPlayback":
      return {
        ...state,
        playback: { ...state.playback, ...action.playback },
      };

    case "markDirty":
      return { ...state, saveStatus: { state: "dirty" } };

    case "markSaving":
      return { ...state, saveStatus: { state: "saving" } };

    case "markSaved":
      return {
        ...state,
        saveStatus: { state: "saved", savedAt: action.savedAt },
      };

    case "markError":
      return { ...state, saveStatus: { state: "error", code: action.code } };
  }
}

type EditorContextValue = {
  state: EditorState;
  dispatch: Dispatch<EditorAction>;
  refs: {
    dirtyDslRef: React.MutableRefObject<EditorDslV3 | null>;
  };
};

const EditorContext = createContext<EditorContextValue | null>(null);

export function EditorStoreProvider({
  initialDsl,
  children,
}: {
  initialDsl: EditorDslV3;
  children: ReactNode;
}) {
  const [state, dispatch] = useReducer(reducer, {
    dsl: initialDsl,
    saveStatus: { state: "saved", savedAt: initialDsl.updatedAt },
    playback: { isPlaying: false, currentTimeSec: 0 },
    selection: { kind: "none" },
  });

  const dirtyDslRef = useRef<EditorDslV3 | null>(null);

  // Keep `dirtyDslRef` current so the autosave effect reads the latest DSL
  // without needing `state` as a dependency (avoids restarting the debounce
  // timer on every dispatch). Effect-only mutation keeps us clear of
  // "cannot update ref during render" lint rules.
  useEffect(() => {
    if (state.saveStatus.state === "dirty") {
      dirtyDslRef.current = state.dsl;
    }
  }, [state.dsl, state.saveStatus.state]);

  const value = useMemo<EditorContextValue>(
    () => ({ state, dispatch, refs: { dirtyDslRef } }),
    [state],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function useEditorStore(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) {
    throw new Error("useEditorStore must be used inside EditorStoreProvider");
  }
  return ctx;
}

// --- convenience hooks ------------------------------------------------------

export function useEditorDispatch() {
  return useEditorStore().dispatch;
}

export function useEditorDsl() {
  return useEditorStore().state.dsl;
}

export function useEditorSelection() {
  return useEditorStore().state.selection;
}

export function useEditorPlayback() {
  return useEditorStore().state.playback;
}

export function useEditorSaveStatus() {
  return useEditorStore().state.saveStatus;
}

export function useSelectedScene(): EditorScene | null {
  const { state } = useEditorStore();
  const selection = state.selection;
  if (selection.kind !== "scene") return null;
  return state.dsl.scenes.find((s) => s.id === selection.sceneId) ?? null;
}

export function useSelectedOverlay(): EditorOverlay | null {
  const { state } = useEditorStore();
  const selection = state.selection;
  if (selection.kind !== "overlay") return null;
  return (
    state.dsl.overlays.find((o) => o.id === selection.overlayId) ?? null
  );
}

// Re-export types so overlay/inspector components can import from here.
export type {
  EditorAudio,
  EditorDslV3,
  EditorOverlay,
  EditorScene,
  OverlayAnimation,
  OverlayPosition,
  OverlayTextStyle,
};
