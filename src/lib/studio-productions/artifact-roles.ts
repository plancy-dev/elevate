/**
 * Suggested `artifact_role` values for Studio Productions (ADR-003).
 * UI offers these via `<datalist>`; DB remains free-text.
 * @see docs/STUDIO_ARTIFACT_ROLES.md
 */
export const STUDIO_SUGGESTED_ARTIFACT_ROLES = [
  "hook",
  "title",
  "script_draft",
  "script",
  "prompt",
  "settings",
  "render_output",
  "tts_audio",
  "subtitle_srt",
  "subtitle_vtt",
  "scene_clip",
  "scene_keyframe_candidate",
  "scene_keyframe_first",
  "scene_keyframe_last",
  "assembled_video",
  "thumbnail",
  "timed_script",
  "packaging_draft",
  "social_captions",
  "reference_source",
  "title_suggestion",
  "compliance_note",
  "other",
] as const;

/** Scene keyframe artifact roles (ADR-009 §3). */
export const STUDIO_SCENE_KEYFRAME_ROLES = [
  "scene_keyframe_candidate",
  "scene_keyframe_first",
  "scene_keyframe_last",
] as const;
export type StudioSceneKeyframeRole =
  (typeof STUDIO_SCENE_KEYFRAME_ROLES)[number];

export function isSceneKeyframeRole(
  role: string,
): role is StudioSceneKeyframeRole {
  return (STUDIO_SCENE_KEYFRAME_ROLES as readonly string[]).includes(role);
}

export type StudioSuggestedArtifactRole =
  (typeof STUDIO_SUGGESTED_ARTIFACT_ROLES)[number];

export const STUDIO_ARTIFACT_ROLE_DATALIST_ID =
  "studio-artifact-role-suggestions";
