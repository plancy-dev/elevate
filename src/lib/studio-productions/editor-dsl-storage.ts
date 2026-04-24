/**
 * Read-only helpers for extracting the editor DSL from a persisted
 * `episode.pipeline_prefs` JSONB. Kept out of `"use server"` modules so
 * server components can import freely without the async-only constraint.
 */
import {
  parseEditorDslV3,
  type EditorDslV3,
} from "@/lib/studio-productions/editor-dsl";
import type { Json } from "@/types/database.types";

export function readEditorDslFromPipelinePrefs(
  prefs: Json | null,
): EditorDslV3 | null {
  if (!prefs || typeof prefs !== "object" || Array.isArray(prefs)) return null;
  const editor = (prefs as { editor?: unknown }).editor;
  return parseEditorDslV3(editor);
}
