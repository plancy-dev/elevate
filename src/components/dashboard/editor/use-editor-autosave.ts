"use client";

import { useEffect, useRef } from "react";
import { saveEditorDsl } from "@/actions/studio-editor";
import {
  useEditorDispatch,
  useEditorSaveStatus,
  useEditorStore,
} from "@/components/dashboard/editor/store";

/**
 * Autosave DSL changes with 3 s debounce. Runs inside the editor shell, not
 * the store module, so tests can render the store without hitting the
 * server. Skips saves when the DSL is not dirty.
 */
export function useEditorAutosave(episodeId: string): void {
  const { state } = useEditorStore();
  const dispatch = useEditorDispatch();
  const status = useEditorSaveStatus();
  const inFlight = useRef(false);

  useEffect(() => {
    if (status.state !== "dirty") return;
    if (inFlight.current) return;

    const handle = window.setTimeout(async () => {
      if (inFlight.current) return;
      inFlight.current = true;
      dispatch({ type: "markSaving" });

      const fd = new FormData();
      fd.set("episode_id", episodeId);
      fd.set("dsl", JSON.stringify(state.dsl));
      try {
        const result = await saveEditorDsl(null, fd);
        if (result?.ok) {
          dispatch({
            type: "markSaved",
            savedAt: result.serverUpdatedAt ?? state.dsl.updatedAt,
          });
        } else if (result?.error) {
          dispatch({ type: "markError", code: result.error });
        }
      } catch (err) {
        dispatch({
          type: "markError",
          code: err instanceof Error ? err.message : "unknown",
        });
      } finally {
        inFlight.current = false;
      }
    }, 3000);

    return () => {
      window.clearTimeout(handle);
    };
  }, [dispatch, episodeId, state.dsl, status.state]);
}
