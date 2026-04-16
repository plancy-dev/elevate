/**
 * Maps artifact roles to workflow phases for Overview / “At a glance” grouping.
 * Aligns with episode tabs: Sources & references → Script → Produce.
 */

export type StudioArtifactWorkflowPhase = "input" | "draft" | "produce" | "other";

const DRAFT_ROLES = new Set([
  "hook",
  "title",
  "script_draft",
  "script",
  "prompt",
  "title_suggestion",
  "compliance_note",
]);

const PRODUCE_ROLES = new Set([
  "timed_script",
  "packaging_draft",
  "tts_audio",
  "subtitle_srt",
  "scene_clip",
  "assembled_video",
  "thumbnail",
  "render_output",
  "settings",
]);

export function studioArtifactWorkflowPhase(
  artifactRole: string,
): StudioArtifactWorkflowPhase {
  const r = artifactRole.trim().toLowerCase();
  if (r === "reference_source" || r.startsWith("reference")) {
    return "input";
  }
  if (DRAFT_ROLES.has(r)) return "draft";
  if (PRODUCE_ROLES.has(r)) return "produce";
  return "other";
}

export const STUDIO_ARTIFACT_PHASE_ORDER: StudioArtifactWorkflowPhase[] = [
  "input",
  "draft",
  "produce",
  "other",
];
